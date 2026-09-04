import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT_PATH = new URL('../prompts/receipt-extraction.md', import.meta.url);

async function loadPrompt(): Promise<string> {
  try {
    return await readFile(PROMPT_PATH, 'utf-8');
  } catch {
    return `You are a receipt extraction system. Analyze the provided image and determine whether it is a receipt. If it is a receipt, extract the merchant name, date, total amount and all visible line items. Never guess or invent information. If a field cannot be determined, return null. Return the result using the required structured JSON schema.`;
  }
}

interface ReceiptItem {
  name: string | null;
  quantity: string | null;
  price: string | null;
}

interface ExtractionResult {
  document_type: 'receipt' | 'not_receipt' | 'unreadable';
  merchant?: string | null;
  date?: string | null;
  total?: string | null;
  items?: ReceiptItem[];
}

function validateResult(data: unknown): ExtractionResult {
  if (!data || typeof data !== 'object') {
    return { document_type: 'unreadable' };
  }
  const obj = data as Record<string, unknown>;
  const docType = obj.document_type;
  if (docType === 'not_receipt' || docType === 'unreadable') {
    return { document_type: docType };
  }
  if (docType !== 'receipt') {
    return { document_type: 'unreadable' };
  }
  const items = Array.isArray(obj.items) ? (obj.items as unknown[]).map((item) => {
    const i = (item || {}) as Record<string, unknown>;
    return {
      name: typeof i.name === 'string' ? i.name : null,
      quantity: typeof i.quantity === 'string' ? i.quantity : null,
      price: typeof i.price === 'string' ? i.price : null,
    };
  }) : [];
  return {
    document_type: 'receipt',
    merchant: typeof obj.merchant === 'string' ? obj.merchant : null,
    date: typeof obj.date === 'string' ? obj.date : null,
    total: typeof obj.total === 'string' ? obj.total : null,
    items,
  };
}

app.use(cors());

app.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured on the server.' });
    }

    const prompt = await loadPrompt();
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the receipt information from this image. Return only JSON.' },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(200).json({ document_type: 'unreadable' });
    }

    const result = validateResult(parsed);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'ECONNRESET' || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'Unable to connect to the AI service. Please check your connection and try again.' });
    }
    if (error?.message?.includes('429')) {
      return res.status(429).json({ error: 'The AI service is busy. Please try again in a moment.' });
    }
    return res.status(500).json({ error: 'Something went wrong while analyzing the receipt. Please try again.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Snap & Sort backend running on http://localhost:${PORT}`);
});
