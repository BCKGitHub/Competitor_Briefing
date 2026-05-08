import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  question: string;
  scrapedContent: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("VITE_OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { question, scrapedContent }: GenerateRequest = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are ScoutAI, a competitive intelligence analyst. Given a user's research question and optionally scraped webpage content from competitor sites, produce a structured competitive brief with analytics.

You MUST respond with valid JSON matching this exact schema:
{
  "landscapeSummary": "A 2-4 sentence overview of the competitive landscape relevant to the question",
  "whoIsPlaying": ["Company1", "Company2", ...],
  "dominantMessagingThemes": ["Theme 1 description", "Theme 2 description", ...],
  "theGap": "A clear description of the unmet need or market opportunity you've identified",
  "recommendedAngle": "A specific, actionable positioning recommendation",
  "analytics": {
    "marketSaturation": 65,
    "opportunityScore": 78,
    "competitorCount": 6,
    "gapSeverity": 82,
    "entryBarrier": "Medium",
    "timeToMarket": "3-6 months",
    "confidenceLevel": 74
  }
}

Guidelines:
- landscapeSummary: Provide market context, key dynamics, and competitive intensity
- whoIsPlaying: List 3-8 specific companies/products competing in this space
- dominantMessagingThemes: Identify 3-5 messaging patterns used by competitors (be specific, quote phrases where possible)
- theGap: Identify a genuine unmet need based on the evidence. Be specific about WHO is underserved and WHY
- recommendedAngle: Give a concrete positioning strategy with target audience, key message, and differentiation
- analytics: Provide quantitative assessments:
  - marketSaturation: 0-100 score of how crowded the market is (higher = more saturated)
  - opportunityScore: 0-100 score of how strong the identified opportunity is (higher = better opportunity)
  - competitorCount: number of significant competitors identified
  - gapSeverity: 0-100 score of how severe/unaddressed the gap is (higher = more opportunity)
  - entryBarrier: "Low", "Medium", or "High" - difficulty of entering this space
  - timeToMarket: estimated time to capitalize on the gap (e.g., "1-3 months", "3-6 months", "6-12 months")
  - confidenceLevel: 0-100 score of how confident you are in this analysis (based on data quality)

If scraped content is provided, base your analysis heavily on the actual data. If not, use your knowledge of the market.
Respond ONLY with the JSON object, no markdown fences or explanation.`;

    const userMessage = scrapedContent
      ? `Research question: ${question}\n\nHere is scraped content from competitor websites:\n\n${scrapedContent.slice(0, 30000)}`
      : `Research question: ${question}\n\nNo specific URLs were provided. Please use your knowledge of this market to produce the competitive brief.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenAI API error ${response.status}: ${errText}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from OpenAI" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const brief = JSON.parse(content);

    if (
      !brief.landscapeSummary ||
      !brief.whoIsPlaying ||
      !brief.dominantMessagingThemes ||
      !brief.theGap ||
      !brief.recommendedAngle
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid brief structure from AI", raw: content }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
