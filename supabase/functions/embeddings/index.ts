import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmbeddingRequest {
  scenarioId: string;
  text: string;
}

interface ContextRequest {
  scenarioId: string;
  query: string;
  topK?: number;
}

// Function to generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Function to chunk text into meaningful segments
function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  let currentChunk = "";
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === "generate") {
      // Generate embeddings for a scenario
      const { scenarioId, text }: EmbeddingRequest = await req.json();
      
      if (!scenarioId || !text) {
        return new Response(
          JSON.stringify({ error: "Missing scenarioId or text" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Chunk the text
      const chunks = chunkText(text);
      const embeddings: { chunk_text: string; embedding: number[] }[] = [];

      // Generate embeddings for each chunk
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        embeddings.push({ chunk_text: chunk, embedding });
      }

      return new Response(
        JSON.stringify({ embeddings }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "context") {
      // Retrieve relevant context for a query
      const { scenarioId, query, topK = 3 }: ContextRequest = await req.json();
      
      if (!scenarioId || !query) {
        return new Response(
          JSON.stringify({ error: "Missing scenarioId or query" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);

      // Get existing embeddings for the scenario
      const supabaseUrl = Deno.env.get("SB_URL") || Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SB_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const embeddingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/scenario_embeddings?scenario_id=eq.${scenarioId}`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!embeddingsResponse.ok) {
        throw new Error("Failed to fetch embeddings");
      }

      const embeddings = await embeddingsResponse.json();

      // Calculate similarities and sort
      const similarities = embeddings
        .map((emb: any) => ({
          chunk_text: emb.chunk_text,
          similarity: cosineSimilarity(queryEmbedding, emb.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return new Response(
        JSON.stringify({ context: similarities }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Embeddings error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
