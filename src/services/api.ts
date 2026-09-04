import type { ExtractionResult } from '@/types';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract`;

export async function extractReceipt(file: File): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append('image', file);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (err) {
    console.error('[extractReceipt] Network/fetch error:', err);
    throw new Error('NETWORK_FAILURE');
  }

  if (!response.ok) {
    let data: { error?: string; detail?: string } = {};
    try {
      data = await response.json();
    } catch {
      // response body wasn't JSON
    }

    console.error(`[extractReceipt] Server error ${response.status}:`, data);

    if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    if (response.status === 429) {
      throw new Error(data.error?.includes('no available API quota') ? 'OPENAI_QUOTA' : 'RATE_LIMIT');
    }
    if (response.status === 500 && data?.error?.includes('OPENAI_API_KEY')) {
      throw new Error('MISSING_API_KEY');
    }
    throw new Error(data.error || 'API_ERROR');
  }

  const json = await response.json();

  if (!json || typeof json !== 'object' || !json.document_type) {
    console.error('[extractReceipt] Unexpected response shape:', json);
    throw new Error('API_ERROR');
  }

  return json as ExtractionResult;
}
