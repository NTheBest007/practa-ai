import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Function to generate embeddings using OpenRouter (OpenAI compatible)
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API;
  if (!apiKey) throw new Error('OPENROUTER_API not configured');

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Practa AI',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter embedding error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Function to chunk text into meaningful segments
function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  let currentChunk = '';
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { action, scenarioId, text } = await req.json();

    if (action === 'generate') {
      if (!scenarioId || !text) {
        return NextResponse.json(
          { error: 'Missing scenarioId or text' },
          { status: 400 }
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

      return NextResponse.json({ embeddings });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Embeddings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
