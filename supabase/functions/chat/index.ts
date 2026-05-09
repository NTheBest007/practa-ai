import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  scenarioDoc: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}

const SYSTEM_WRAPPER = `You are a method actor playing a prospect in a sales training simulation. You MUST stay in character at all times. Never break character. Never mention that you are an AI, a language model, or a simulation.

Here is your full character brief — absorb it completely and embody this person:

---
{PERSONA}
---

RELEVANT CONTEXT FOR THIS RESPONSE:
{CONTEXT}

Rules:
- Respond ONLY as this character. Use their speech patterns, concerns, and personality.
- Keep replies concise — 1 to 3 sentences max, like a real phone conversation.
- React naturally to what the sales rep says. Push back when appropriate. Warm up if they earn it.
- Use the RELEVANT CONTEXT above to inform your response - reference specific details about your situation, concerns, or personality traits.
- Never reveal information the sales rep hasn't asked about or earned through good conversation.
- If the rep is vague or pushy, respond with realistic resistance.
- If the rep builds genuine rapport and asks smart questions, gradually open up.`;

async function callGroq(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API");
  if (!apiKey) throw new Error("GROQ_API not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "...";
}

async function callOpenRouter(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API");
  if (!apiKey) throw new Error("OPENROUTER_API not configured");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "...";
}

async function callGemini(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = Deno.env.get("GOOGLESTUDIO_API");
  if (!apiKey) throw new Error("GOOGLESTUDIO_API not configured");

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "...";
}

// Function to retrieve relevant context using embeddings
async function getRelevantContext(scenarioId: string, userMessage: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SB_URL") || Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SB_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const contextResponse = await fetch(
      `${supabaseUrl}/functions/v1/embeddings/context`,
      {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId,
          query: userMessage,
          topK: 3,
        }),
      }
    );

    if (!contextResponse.ok) {
      console.log("Failed to get context, using fallback");
      return "No specific context available.";
    }

    const { context } = await contextResponse.json();
    return context
      .map((c: any) => c.chunk_text)
      .join("\n\n");
  } catch (error) {
    console.log("Embeddings not available, using fallback");
    return "No specific context available.";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { scenarioDoc, history, userMessage, scenarioId }: ChatRequest & { scenarioId?: string } = await req.json();

    if (!userMessage?.trim()) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get relevant context using embeddings
    const relevantContext = scenarioId ? await getRelevantContext(scenarioId, userMessage) : "No specific context available.";

    const systemPrompt = SYSTEM_WRAPPER
      .replace("{PERSONA}", scenarioDoc || "You are a busy business prospect.")
      .replace("{CONTEXT}", relevantContext);

    const messages = [
      ...(history || []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ];

    let reply: string | null = null;
    let lastError: string | null = null;

    // Try Groq first (fastest)
    try {
      reply = await callGroq(systemPrompt, messages);
    } catch (e) {
      lastError = `Groq: ${(e as Error).message}`;
    }

    // Fallback to OpenRouter
    if (!reply) {
      try {
        reply = await callOpenRouter(systemPrompt, messages);
      } catch (e) {
        lastError = `OpenRouter: ${(e as Error).message}`;
      }
    }

    // Fallback to Gemini
    if (!reply) {
      try {
        reply = await callGemini(systemPrompt, messages);
      } catch (e) {
        lastError = `Gemini: ${(e as Error).message}`;
      }
    }

    if (!reply) {
      return new Response(
        JSON.stringify({ error: `All providers failed. Last: ${lastError}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Bad request" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
