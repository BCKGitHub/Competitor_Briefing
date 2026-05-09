import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Radar, ArrowRight, RotateCcw } from 'lucide-react';
import BriefResultsCard, { type BriefData } from './BriefResultsCard';
import HistoryPanel, { type BriefHistoryEntry } from './HistoryPanel';
import { supabase, sessionId } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function scrapeUrls(urls: string[]): Promise<{ url: string; markdown: string | null; error: string | null }[]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-urls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls }),
  });
  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

async function generateBrief(question: string, scrapedContent: string | null): Promise<BriefData> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-brief`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, scrapedContent }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Generate failed: ${response.status}`);
  }
  const data = await response.json();
  return data.brief;
}


function LoadingState({ message }: { message: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-12 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-teal-900/50 flex items-center justify-center">
            <Radar className="w-8 h-8 text-teal-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-teal-500/40 animate-ping opacity-30" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-100">ScoutAI is researching</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="loading-dot w-2 h-2 rounded-full bg-teal-400 inline-block" />
            <span className="loading-dot w-2 h-2 rounded-full bg-teal-400 inline-block" />
            <span className="loading-dot w-2 h-2 rounded-full bg-teal-400 inline-block" />
          </div>
        </div>

        <div className="w-full space-y-3 mt-4">
          <div className="shimmer-bar-dark h-4 rounded-full w-full" />
          <div className="shimmer-bar-dark h-4 rounded-full w-5/6" />
          <div className="shimmer-bar-dark h-4 rounded-full w-4/6" />
          <div className="shimmer-bar-dark h-4 rounded-full w-3/4" />
        </div>

        <p className="text-sm text-slate-400 mt-2">
          {message}
        </p>
      </div>
    </div>
  );
}

type AppState = 'input' | 'loading' | 'results';

function App() {
  const [question, setQuestion] = useState('');
  const [urls, setUrls] = useState('');
  const [appState, setAppState] = useState<AppState>('input');
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<BriefHistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing competitors, gathering insights, and building your brief...');
  const abortRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from('briefs')
      .select('id, objective, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setHistoryEntries(data);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveBrief = async (objective: string, briefUrls: string, brief: BriefData) => {
    const { data } = await supabase
      .from('briefs')
      .insert({
        objective,
        urls: briefUrls,
        landscape_summary: brief.landscapeSummary,
        who_is_playing: brief.whoIsPlaying,
        dominant_messaging_themes: brief.dominantMessagingThemes,
        the_gap: brief.theGap,
        recommended_angle: brief.recommendedAngle,
        analytics: brief.analytics || null,
        session_id: sessionId,
      })
      .select('id')
      .maybeSingle();
    if (data) {
      setActiveHistoryId(data.id);
      fetchHistory();
    }
  };

  const clearHistory = async () => {
    const ids = historyEntries.map((e) => e.id);
    if (ids.length === 0) return;
    await supabase.from('briefs').delete().in('id', ids);
    setHistoryEntries([]);
    setActiveHistoryId(null);
    setBriefData(null);
    setAppState('input');
    setQuestion('');
    setUrls('');
  };

  const loadBrief = async (id: string) => {
    const { data } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setBriefData({
        landscapeSummary: data.landscape_summary,
        whoIsPlaying: data.who_is_playing as string[],
        dominantMessagingThemes: data.dominant_messaging_themes as string[],
        theGap: data.the_gap,
        recommendedAngle: data.recommended_angle,
        analytics: data.analytics || undefined,
      });
      setQuestion(data.objective);
      setUrls(data.urls || '');
      setActiveHistoryId(id);
      setAppState('results');
      setHistoryOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAppState('loading');
    setActiveHistoryId(null);
    abortRef.current = false;

    let scrapedContent: string | null = null;

    const parsedUrls = urls
      .split(/[,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));

    if (parsedUrls.length > 0) {
      setLoadingMessage('Scraping competitor URLs with Firecrawl...');
      try {
        const results = await scrapeUrls(parsedUrls);
        if (abortRef.current) return;
        scrapedContent = results
          .filter((r) => r.markdown)
          .map((r) => `--- ${r.url} ---\n${r.markdown}`)
          .join('\n\n') || null;
      } catch {
        // continue without scraped content
      }
    }

    if (abortRef.current) return;
    setLoadingMessage('Generating your competitive brief with AI...');

    try {
      const brief = await generateBrief(question, scrapedContent);
      if (abortRef.current) return;
      setBriefData(brief);
      setAppState('results');
      saveBrief(question, urls, brief);
    } catch (err) {
      if (abortRef.current) return;
      setLoadingMessage(`Error: ${(err as Error).message}. Please try again.`);
      setTimeout(() => {
        if (!abortRef.current) setAppState('input');
      }, 3000);
    }
  };

  const handleReset = () => {
    abortRef.current = true;
    setAppState('input');
    setBriefData(null);
    setQuestion('');
    setUrls('');
    setActiveHistoryId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <HistoryPanel
        entries={historyEntries}
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
        onSelect={loadBrief}
        onClearAll={clearHistory}
        activeId={activeHistoryId}
      />

      <div className="fixed inset-0 opacity-[0.04] pointer-events-none text-teal-300" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className={`relative min-h-screen flex flex-col items-center px-4 py-16 transition-all duration-300 ${historyOpen ? 'sm:pl-[340px]' : ''}`}>
        {/* Header */}
        <div className={`text-center transition-all duration-500 ${appState === 'results' ? 'mb-8' : 'mb-10 mt-auto'}`}>
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ScoutAI</span>
          </div>
          {appState !== 'results' && (
            <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed font-bold">
              Get structured competitive intelligence briefs in minutes.
            </p>
          )}
        </div>

        {/* Main content area */}
        <div className={`w-full ${appState === 'input' ? 'mb-auto' : ''}`}>
          {appState === 'input' && (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl mx-auto bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 border border-slate-700/60 p-8 transition-all duration-300"
            >
              <label
                htmlFor="question"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Which Industry / Market you want to explore? Ask your question or URL of the company you want below
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-500 pointer-events-none" />
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  placeholder="e.g. How does Notion's pricing compare to Coda and Slite for teams of 50+? What are their key differentiators?"
                  className="w-full min-h-[140px] pl-12 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-900/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 resize-y transition-all text-[15px] leading-relaxed"
                />
              </div>


              <button
                type="submit"
                disabled={!question.trim()}
                className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-600 text-white font-semibold text-base shadow-lg shadow-teal-600/25 hover:bg-teal-500 hover:shadow-teal-500/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                Generate Brief
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                Typically takes 1-3 minutes depending on scope
              </p>
            </form>
          )}

          {appState === 'loading' && <LoadingState message={loadingMessage} />}

          {appState === 'results' && briefData && (
            <div className="space-y-6">
              <BriefResultsCard data={briefData} />
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 shadow-sm hover:bg-slate-700 hover:border-slate-500 active:scale-[0.98] transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Research
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
