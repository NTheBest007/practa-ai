import { supabase } from './supabase';

export async function generateScenarioEmbeddings(scenarioId: string, text: string) {
  try {
    // Call local API instead of Supabase Edge Function
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        scenarioId,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate embeddings: ${error}`);
    }

    const { embeddings } = await response.json();

    // Store embeddings in database
    for (const embedding of embeddings) {
      await supabase
        .from('scenario_embeddings')
        .insert({
          scenario_id: scenarioId,
          chunk_text: embedding.chunk_text,
          embedding: embedding.embedding,
        });
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export async function checkScenarioEmbeddings(scenarioId: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('scenario_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('scenario_id', scenarioId);
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking embeddings:', error);
    return false;
  }
}
