import OpenAI from "npm:openai@4.77.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROMPT = `You are a receipt extraction system. Analyze the provided image and determine whether it is a receipt.

A receipt is a document showing a transaction, typically from a store, restaurant, or service provider, listing purchased items and a total amount.

## Task

1. Determine if the image is a receipt.
2. If the image is NOT a receipt (e.g. a landscape photo, a screenshot of a chat, a person, a product label without transaction info), return document_type: "not_receipt".
3. If the image IS a receipt, extract the following fields:
   - merchant: The name of the business/store.
   - date: The transaction date in YYYY-MM-DD format. If only a partial date is visible, return null.
   - total: The total amount as a string of numbers only (no currency symbol).
   - items: An array of line items, each with:
     - name: The item name/description.
     - quantity: The quantity as a string (default "1" if not specified).
     - price: The line price as a string of numbers only.

## Rules

- NEVER guess or invent information. If a field cannot be read clearly from the receipt, return null (for merchant/date/total) or an empty string (for item fields).
- Do not include currency symbols, thousands separators, or units in numeric fields.
- If the image is blurry but still recognizably a receipt, extract what you can and set unreadable fields to null.
- Do not include any commentary. Return ONLY the JSON object.

## Output Schema

If the image is a receipt:
{"document_type":"receipt","merchant":"Example Store","date":"2026-09-04","total":"1250.50","items":[{"name":"Milk","quantity":"2","price":"120"}]}

If the image is not a receipt:
{"document_type":"not_receipt"}

If the image is too blurry or unreadable to determine whether it is a receipt:
{"document_type":"unreadable"}`;

interface ReceiptItem {
  name: string | null;
  quantity: string | null;
  price: string | null;
}

interface ExtractionResult {
  document_type: "receipt" | "not_receipt" | "unreadable";
  merchant?: string | null;
  date?: string | null;
  total?: string | null;
  items?: ReceiptItem[];
}

function validateResult(data: unknown): ExtractionResult {
  if (!data || typeof data !== "object") {
    return { document_type: "unreadable" };
  }
  const obj = data as Record<string, unknown>;
  const docType = obj.document_type;
  if (docType === "not_receipt" || docType === "unreadable") {
    return { document_type: docType };
  }
  if (docType !== "receipt") {
    return { document_type: "unreadable" };
  }
  const items: ReceiptItem[] = Array.isArray(obj.items)
    ? (obj.items as unknown[]).map((item) => {
        const i = (item || {}) as Record<string, unknown>;
        return {
          name: typeof i.name === "string" ? i.name : null,
          quantity: typeof i.quantity === "string" ? i.quantity : null,
          price: typeof i.price === "string" ? i.price : null,
        };
      })
    : [];
  return {
    document_type: "receipt",
    merchant: typeof obj.merchant === "string" ? obj.merchant : null,
    date: typeof obj.date === "string" ? obj.date : null,
    total: typeof obj.total === "string" ? obj.total : null,
    items,
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    console.error("[extract] OPENAI_API_KEY secret is not set.");
    return new Response(
      JSON.stringify({
        error:
          "OPENAI_API_KEY is not configured. Please add it to Bolt Secrets (Project Settings > Secrets) as OPENAI_API_KEY.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      console.error("[extract] No image file in request.");
      return new Response(
        JSON.stringify({ error: "No image file provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[extract] Received image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    if (file.size > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum 15 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dataUrl = await fileToDataUrl(file);

    const openai = new OpenAI({ apiKey });

    console.log("[extract] Calling OpenAI vision API...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the receipt information from this image. Return only JSON." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    console.log(`[extract] OpenAI response: ${content.slice(0, 500)}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error("[extract] Failed to parse OpenAI JSON response:", parseErr);
      return new Response(
        JSON.stringify({ document_type: "unreadable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = validateResult(parsed);
    console.log(`[extract] Validated result: document_type=${result.document_type}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; status?: number; type?: string };

    console.error("[extract] Error during extraction:");
    console.error("  code:", error?.code);
    console.error("  message:", error?.message);
    console.error("  status:", error?.status);

    if (error?.code === "ECONNRESET" || error?.code === "ENOTFOUND" || error?.code === "ETIMEDOUT") {
      return new Response(
        JSON.stringify({ error: "Unable to connect to the AI service. Please check your connection and try again." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (error?.status === 429 || error?.message?.includes("429")) {
      const message = error?.message?.toLowerCase() || "";
      const isQuotaError =
        error?.code === "insufficient_quota" ||
        error?.type === "insufficient_quota" ||
        message.includes("quota") ||
        message.includes("billing");
      return new Response(
        JSON.stringify({
          error: isQuotaError
            ? "The OpenAI account has no available API quota. Please add billing or credits to the OpenAI account, then try again."
            : "The AI service is busy. Please try again in a moment.",
          code: isQuotaError ? "OPENAI_QUOTA" : "OPENAI_RATE_LIMIT",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (error?.status === 401 || error?.message?.includes("401") || error?.message?.includes("Incorrect API key")) {
      return new Response(
        JSON.stringify({ error: "The OpenAI API key is invalid. Please check your OPENAI_API_KEY in Bolt Secrets." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        error: "Something went wrong while analyzing the receipt. Please try again.",
        detail: error?.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
