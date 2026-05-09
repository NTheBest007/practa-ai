import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachingRequest {
  conversation: Array<{ role: string; content: string }>;
  scenarioDoc?: string;
  frameworks?: string[];
}

interface CoachingTip {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  framework?: string;
  stage?: string;
}

const COACHING_PROMPT = `You are an expert sales coach analyzing a live conversation in real-time. Your job is to provide specific, actionable coaching tips based on the conversation flow and sales frameworks.

SALES FRAMEWORKS TO USE:
1. The Setting Script - 3 phases: Intent (Opening), Logical Certainty (Discovery/Pain), Transition (Qualification & Close)
2. The Red Book of Questions - 5 stages: Connection, Situation, Problem Awareness, Solution Awareness, Consequence Questions

ANALYZE THE CONVERSATION and provide coaching tips in JSON format:
{
  "tips": [
    {
      "category": "rapport" | "discovery" | "objection_handling" | "closing" | "framework_stage" | "improvement",
      "priority": "high" | "medium" | "low", 
      "message": "Specific actionable advice",
      "framework": "Setting Script or Red Book",
      "stage": "Current stage the user should be in"
    }
  ],
  "current_stage": "What stage they're in",
  "next_step": "What they should do next",
  "score_this_exchange": 0-100
}

GUIDELINES:
- Be encouraging but specific
- Focus on what they should do NOW, not general advice
- Reference specific framework stages when relevant
- If they're doing well, acknowledge it
- If they're missing opportunities, point them out
- Keep tips concise and actionable
- Score the last exchange (0-100)`;

async function callLLM(prompt: string): Promise<string> {
  const groqKey = Deno.env.get("GROQ_API");
  if (groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    }
  }

  const openrouterKey = Deno.env.get("OPENROUTER_API");
  if (openrouterKey) {
    console.log("[Coach] Trying OpenRouter...");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://practa-ai.com",
        "X-Title": "Practa AI Coaching",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    }
  }

  const geminiKey = Deno.env.get("GOOGLESTUDIO_API");
  if (geminiKey) {
    console.log("[Coach] Trying Gemini...");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log("[Coach] Gemini success");
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const error = await res.text();
      console.error("[Coach] Gemini failed:", error);
    }
  }

  console.error("[Coach] All AI providers failed");
  throw new Error("No AI providers available");
}

Deno.serve(async (req: Request) => {
  console.log(`[Coach] ${req.method} request received`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[Coach] Request body:", JSON.stringify(body).substring(0, 200));
    
    const { conversation, scenarioDoc, frameworks = ["Setting Script", "Red Book"] }: CoachingRequest = body;

    if (!conversation || conversation.length === 0) {
      return new Response(
        JSON.stringify({ error: "No conversation provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format conversation for analysis
    const conversationText = conversation
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const prompt = `${COACHING_PROMPT}

CONVERSATION TO ANALYZE:
${conversationText}

${scenarioDoc ? `\nSCENARIO CONTEXT:\n${scenarioDoc}` : ""}

AVAILABLE FRAMEWORKS: ${frameworks.join(", ")}

Provide coaching advice based on this conversation.`;

    console.log("[Coach] Calling LLM...");
    const response = await callLLM(prompt);
    console.log("[Coach] LLM response:", response.substring(0, 200));
    
    // Try to parse JSON response
    let coachingData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      coachingData = JSON.parse(jsonStr);
      console.log("[Coach] Parsed coaching data successfully");
    } catch (e) {
      console.error("[Coach] JSON parse error:", e);
      // Fallback if JSON parsing fails
      coachingData = {
        tips: [{
          category: "general",
          priority: "medium",
          message: response.substring(0, 200) + "...",
        }],
        current_stage: "Analyzing...",
        next_step: "Continue the conversation",
        score_this_exchange: 70
      };
    }

    console.log("[Coach] Returning coaching data");
    return new Response(
      JSON.stringify(coachingData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Coach] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        tips: [{
          category: "system",
          priority: "low",
          message: "Coaching temporarily unavailable",
        }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
