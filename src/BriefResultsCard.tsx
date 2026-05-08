import { useState } from 'react';
import { Map, Users, MessageSquare, Lightbulb, Target, Copy, Check, Download, TrendingUp, BarChart3, Shield, Clock } from 'lucide-react';

export interface BriefAnalytics {
  marketSaturation: number;
  opportunityScore: number;
  competitorCount: number;
  gapSeverity: number;
  entryBarrier: string;
  timeToMarket: string;
  confidenceLevel: number;
}

export interface BriefData {
  landscapeSummary: string;
  whoIsPlaying: string[];
  dominantMessagingThemes: string[];
  theGap: string;
  recommendedAngle: string;
  analytics?: BriefAnalytics;
}

function SectionHeader({ icon: Icon, title, accent }: { icon: React.ElementType; title: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 mb-3 ${accent ? 'text-amber-400' : 'text-slate-300'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-amber-900/40' : 'bg-slate-700/60'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const colorMap = {
  teal: { bg: 'bg-teal-900/30', border: 'border-teal-700/40', text: 'text-teal-300', bar: 'bg-teal-500' },
  amber: { bg: 'bg-amber-900/30', border: 'border-amber-700/40', text: 'text-amber-300', bar: 'bg-amber-500' },
  rose: { bg: 'bg-rose-900/30', border: 'border-rose-700/40', text: 'text-rose-300', bar: 'bg-rose-500' },
  blue: { bg: 'bg-blue-900/30', border: 'border-blue-700/40', text: 'text-blue-300', bar: 'bg-blue-500' },
} as const;

function MetricCard({ label, value, suffix, color, icon: Icon }: {
  label: string;
  value: number;
  suffix: string;
  color: keyof typeof colorMap;
  icon: React.ElementType;
}) {
  const c = colorMap[color];
  return (
    <div className={`p-3 rounded-xl ${c.bg} border ${c.border} text-center transition-transform hover:scale-105`}>
      <Icon className={`w-4 h-4 ${c.text} mx-auto mb-1.5`} />
      <div className={`text-2xl font-bold ${c.text} leading-none`}>
        {value}<span className="text-xs font-normal opacity-70">{suffix}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: keyof typeof colorMap }) {
  const c = colorMap[color];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${c.text}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function briefToPlainText(data: BriefData): string {
  const lines = [
    'COMPETITIVE BRIEF',
    '=================',
    '',
    'LANDSCAPE SUMMARY',
    data.landscapeSummary,
    '',
    'WHO IS PLAYING',
    data.whoIsPlaying.join(', '),
    '',
    'DOMINANT MESSAGING THEMES',
    ...data.dominantMessagingThemes.map((t) => `• ${t}`),
    '',
    'THE GAP',
    data.theGap,
    '',
  ];
  if (data.analytics) {
    lines.push(
      'GAP & OPPORTUNITY ANALYTICS',
      `  Opportunity Score: ${data.analytics.opportunityScore}/100`,
      `  Gap Severity: ${data.analytics.gapSeverity}/100`,
      `  Market Saturation: ${data.analytics.marketSaturation}/100`,
      `  Confidence Level: ${data.analytics.confidenceLevel}/100`,
      `  Competitors: ${data.analytics.competitorCount}`,
      `  Entry Barrier: ${data.analytics.entryBarrier}`,
      `  Time to Market: ${data.analytics.timeToMarket}`,
      '',
    );
  }
  lines.push('YOUR RECOMMENDED ANGLE', data.recommendedAngle);
  return lines.join('\n');
}

export default function BriefResultsCard({ data }: { data: BriefData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(briefToPlainText(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    const analyticsHtml = data.analytics ? `
        <h2>Gap &amp; Opportunity Analytics</h2>
        <div class="analytics-grid">
          <div class="metric-card metric-teal">
            <div class="metric-value">${data.analytics.opportunityScore}<span class="metric-suffix">/100</span></div>
            <div class="metric-label">Opportunity Score</div>
            <div class="metric-bar"><div class="metric-bar-fill bar-teal" style="width: ${data.analytics.opportunityScore}%"></div></div>
          </div>
          <div class="metric-card metric-amber">
            <div class="metric-value">${data.analytics.gapSeverity}<span class="metric-suffix">/100</span></div>
            <div class="metric-label">Gap Severity</div>
            <div class="metric-bar"><div class="metric-bar-fill bar-amber" style="width: ${data.analytics.gapSeverity}%"></div></div>
          </div>
          <div class="metric-card metric-rose">
            <div class="metric-value">${data.analytics.marketSaturation}<span class="metric-suffix">/100</span></div>
            <div class="metric-label">Market Saturation</div>
            <div class="metric-bar"><div class="metric-bar-fill bar-rose" style="width: ${data.analytics.marketSaturation}%"></div></div>
          </div>
          <div class="metric-card metric-blue">
            <div class="metric-value">${data.analytics.confidenceLevel}<span class="metric-suffix">/100</span></div>
            <div class="metric-label">Confidence Level</div>
            <div class="metric-bar"><div class="metric-bar-fill bar-blue" style="width: ${data.analytics.confidenceLevel}%"></div></div>
          </div>
        </div>
        <div class="secondary-metrics">
          <div class="secondary-item">
            <span class="secondary-label">Competitors</span>
            <span class="secondary-value">${data.analytics.competitorCount}</span>
          </div>
          <div class="secondary-item">
            <span class="secondary-label">Entry Barrier</span>
            <span class="secondary-value barrier-${data.analytics.entryBarrier.toLowerCase()}">${escapeHtml(data.analytics.entryBarrier)}</span>
          </div>
          <div class="secondary-item">
            <span class="secondary-label">Time to Market</span>
            <span class="secondary-value">${escapeHtml(data.analytics.timeToMarket)}</span>
          </div>
        </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Competitive Brief — ScoutAI</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 48px; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 22px; margin-bottom: 6px; }
          .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 36px; }
          h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #374151; margin-bottom: 10px; margin-top: 28px; }
          p { font-size: 14px; color: #374151; margin-bottom: 8px; }
          .players { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
          .player-tag { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; font-size: 13px; color: #334155; }
          ul { padding-left: 20px; margin-bottom: 8px; }
          li { font-size: 14px; color: #374151; margin-bottom: 6px; }
          .gap-box { background: #fffbeb; border: 2px solid #fbbf24; border-radius: 10px; padding: 16px 20px; margin-top: 8px; }
          .gap-box p { color: #78350f; font-weight: 500; }
          .angle-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 16px 20px; margin-top: 8px; }
          .angle-box p { color: #134e4a; }
          .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; margin-bottom: 16px; }
          .metric-card { border-radius: 10px; padding: 14px 16px; text-align: center; }
          .metric-teal { background: #f0fdfa; border: 1px solid #99f6e4; }
          .metric-amber { background: #fffbeb; border: 1px solid #fde68a; }
          .metric-rose { background: #fff1f2; border: 1px solid #fecdd3; }
          .metric-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
          .metric-value { font-size: 24px; font-weight: 700; color: #1a1a1a; }
          .metric-suffix { font-size: 12px; font-weight: 400; color: #6b7280; }
          .metric-label { font-size: 11px; color: #6b7280; margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
          .metric-bar { height: 6px; border-radius: 3px; background: #e5e7eb; margin-top: 8px; overflow: hidden; }
          .metric-bar-fill { height: 100%; border-radius: 3px; }
          .bar-teal { background: #14b8a6; }
          .bar-amber { background: #f59e0b; }
          .bar-rose { background: #f43f5e; }
          .bar-blue { background: #3b82f6; }
          .secondary-metrics { display: flex; gap: 12px; margin-bottom: 8px; }
          .secondary-item { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; text-align: center; }
          .secondary-label { display: block; font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 4px; }
          .secondary-value { display: block; font-size: 15px; font-weight: 700; color: #1e293b; }
          .barrier-low { color: #16a34a; }
          .barrier-medium { color: #d97706; }
          .barrier-high { color: #dc2626; }
          @media print { body { padding: 24px; } }
        </style>
      </head>
      <body>
        <h1>Competitive Brief</h1>
        <p class="subtitle">Generated by ScoutAI</p>

        <h2>Landscape Summary</h2>
        <p>${escapeHtml(data.landscapeSummary)}</p>

        <h2>Who Is Playing</h2>
        <div class="players">
          ${data.whoIsPlaying.map((p) => `<span class="player-tag">${escapeHtml(p)}</span>`).join('')}
        </div>

        <h2>Dominant Messaging Themes</h2>
        <ul>
          ${data.dominantMessagingThemes.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>

        <h2>The Gap</h2>
        <div class="gap-box"><p>${escapeHtml(data.theGap)}</p></div>

        ${analyticsHtml}

        <h2>Your Recommended Angle</h2>
        <div class="angle-box"><p>${escapeHtml(data.recommendedAngle)}</p></div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 border border-slate-700/60 overflow-hidden">
        {/* Card header */}
        <div className="px-8 py-5 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Competitive Brief</h2>
            <p className="text-sm text-slate-400 mt-0.5">Generated by ScoutAI</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                copied
                  ? 'bg-teal-900/40 text-teal-300 border border-teal-600/50'
                  : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:border-slate-500'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:border-slate-500 transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* 1. Landscape Summary */}
          <section>
            <SectionHeader icon={Map} title="Landscape Summary" />
            <p className="text-slate-300 leading-relaxed text-[15px] pl-10">
              {data.landscapeSummary}
            </p>
          </section>

          {/* 2. Who Is Playing */}
          <section>
            <SectionHeader icon={Users} title="Who Is Playing" />
            <div className="pl-10 flex flex-wrap gap-2">
              {data.whoIsPlaying.map((player) => (
                <span
                  key={player}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 text-sm font-medium border border-slate-600/60"
                >
                  {player}
                </span>
              ))}
            </div>
          </section>

          {/* 3. Dominant Messaging Themes */}
          <section>
            <SectionHeader icon={MessageSquare} title="Dominant Messaging Themes" />
            <ul className="pl-10 space-y-2">
              {data.dominantMessagingThemes.map((theme) => (
                <li key={theme} className="flex items-start gap-2.5 text-[15px] text-slate-300">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="leading-relaxed">{theme}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. The Gap — visually prominent amber callout */}
          <section>
            <SectionHeader icon={Lightbulb} title="The Gap" accent />
            <div className="ml-10 relative rounded-xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-950/40 via-yellow-950/30 to-orange-950/30 p-5 shadow-sm shadow-amber-900/20">
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
              <p className="text-amber-200 leading-relaxed text-[15px] font-medium">
                {data.theGap}
              </p>
            </div>
          </section>

          {/* 5. Analytics — Gap & Opportunity Stats */}
          {data.analytics && (
            <section>
              <SectionHeader icon={BarChart3} title="Gap & Opportunity Analytics" accent />
              <div className="ml-10 space-y-5">
                {/* Primary metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard
                    label="Opportunity Score"
                    value={data.analytics.opportunityScore}
                    suffix="/100"
                    color="teal"
                    icon={TrendingUp}
                  />
                  <MetricCard
                    label="Gap Severity"
                    value={data.analytics.gapSeverity}
                    suffix="/100"
                    color="amber"
                    icon={Lightbulb}
                  />
                  <MetricCard
                    label="Market Saturation"
                    value={data.analytics.marketSaturation}
                    suffix="/100"
                    color="rose"
                    icon={Users}
                  />
                  <MetricCard
                    label="Confidence"
                    value={data.analytics.confidenceLevel}
                    suffix="/100"
                    color="blue"
                    icon={Shield}
                  />
                </div>

                {/* Progress bars */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                  <ProgressBar label="Opportunity Score" value={data.analytics.opportunityScore} color="teal" />
                  <ProgressBar label="Gap Severity" value={data.analytics.gapSeverity} color="amber" />
                  <ProgressBar label="Market Saturation" value={data.analytics.marketSaturation} color="rose" />
                </div>

                {/* Secondary info row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600/40 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">Competitors</span>
                    </div>
                    <span className="text-xl font-bold text-slate-100">{data.analytics.competitorCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600/40 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">Entry Barrier</span>
                    </div>
                    <span className={`text-base font-bold ${
                      data.analytics.entryBarrier === 'Low' ? 'text-green-400' :
                      data.analytics.entryBarrier === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                    }`}>{data.analytics.entryBarrier}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600/40 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">Time to Market</span>
                    </div>
                    <span className="text-base font-bold text-slate-100">{data.analytics.timeToMarket}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 6. Your Recommended Angle */}
          <section>
            <SectionHeader icon={Target} title="Your Recommended Angle" />
            <div className="pl-10 p-4 rounded-xl bg-teal-900/30 border border-teal-700/50">
              <p className="text-teal-200 leading-relaxed text-[15px]">
                {data.recommendedAngle}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
