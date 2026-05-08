import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScrapeRequest {
  urls: string[];
}

interface ScrapeResult {
  url: string;
  markdown: string | null;
  error: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("VITE_FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { urls }: ScrapeRequest = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide an array of URLs to scrape" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const maxUrls = urls.slice(0, 5);

    const results: ScrapeResult[] = await Promise.all(
      maxUrls.map(async (url) => {
        try {
          const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              formats: ["markdown"],
              onlyMainContent: true,
              timeout: 30000,
            }),
          });

          if (!response.ok) {
            const errBody = await response.text();
            return { url, markdown: null, error: `Firecrawl error ${response.status}: ${errBody}` };
          }

          const data = await response.json();
          return {
            url,
            markdown: data.data?.markdown || null,
            error: null,
          };
        } catch (e) {
          return { url, markdown: null, error: (e as Error).message };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
