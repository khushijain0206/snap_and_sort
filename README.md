# Snap &amp; Sort

A mobile-first receipt scanning app. Take a photo or pick an image, let an AI vision model extract the receipt details, review and correct everything, then save the record locally.

## Project Overview

Snap &amp; Sort helps you digitize receipts without manual data entry. You capture a receipt, the app sends the image to an AI vision model (OpenAI GPT-4o) via a backend proxy, and the extracted data — merchant, date, total, and line items — is shown in an editable form. You review and correct every field, then save the record. Records persist in your browser's localStorage and remain available after refresh.

## Features

- **Capture** — Take a photo with the device camera or pick one from the gallery.
- **AI extraction** — The backend sends the image to OpenAI's vision model and returns structured JSON.
- **Review &amp; Correct** — An editable form for merchant, date, total, and every line item. Add or delete items.
- **Save records** — Records are stored locally (localStorage) and survive page refresh.
- **Saved Records** — Browse, open, and delete saved receipts.
- **Graceful errors** — Handles blurry images, non-receipt images, missing fields, network failures, and API errors.
- **Loading state** — "Analyzing your receipt..." with duplicate-request prevention.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express
- **AI:** OpenAI GPT-4o (vision)
- **Storage:** Browser localStorage

## How the App Works

1. **Home screen** — Choose to take a photo, pick from gallery, or open saved records.
2. **Capture/Preview** — The selected image is previewed. Tap **Extract Receipt**.
3. **Backend** — `POST /extract` receives the image and forwards it to OpenAI with a structured prompt. The AI returns JSON.
4. **Review &amp; Correct** — The returned data fills an editable form. The user fixes or fills in any field (especially fields the AI could not read). The user adds/removes line items.
5. **Save** — On **Save Record**, the corrected data (plus the image) is written to localStorage.
6. **Saved Records** — The user can browse, open details, or delete records.

The app **never** saves the AI result automatically — the user must review and press Save.

## Project Structure

```
snap-and-sort/
├── prompts/
│   └── receipt-extraction.md      # AI prompt used by the backend
├── server/
│   ├── src/
│   │   └── index.ts               # Express server + OpenAI vision call
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── HomeScreen.tsx
│   │   ├── CapturePreview.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── ErrorScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   ├── SavedRecords.tsx
│   │   └── RecordDetail.tsx
│   ├── services/
│   │   ├── api.ts                 # calls backend /extract
│   │   └── storage.ts             # localStorage CRUD
│   ├── types/
│   │   └── index.ts               # shared types
│   ├── utils/
│   │   └── helpers.ts             # formatting + id/file helpers
│   ├── App.tsx                    # screen state machine
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── vite.config.ts
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Install

```bash
npm install
```

### Environment Variables

The OpenAI API key is stored securely as a Supabase Edge Function secret — it is **never** placed in `.env` or exposed to the frontend.

**To add the key:** go to **Project Settings > Secrets** in the Bolt dashboard and add a secret named `OPENAI_API_KEY` with your OpenAI key as the value.

If the key is missing, the app shows a clear message: *"The OpenAI API key is not configured. Please add OPENAI_API_KEY to Bolt Secrets."*

The `.env.example` file documents the old local-server approach for reference only.

## How to Run Frontend

```bash
npm run dev
```

The Vite dev server starts (default http://localhost:5173). The frontend calls the deployed Supabase Edge Function for receipt extraction — no separate backend process is needed.

## How to Run Backend

The receipt extraction backend is a Supabase Edge Function deployed at:

```
POST {SUPABASE_URL}/functions/v1/extract
```

It receives the image as `multipart/form-data` (field name `image`), sends it to OpenAI GPT-4o, and returns structured JSON. The OpenAI API key is read from the `OPENAI_API_KEY` edge function secret.

A local Express server (`server/src/index.ts`) is also included for development reference. To run it:

```bash
npm run dev:server
```

The Express server starts on http://localhost:3001.

## Testing Instructions

End-to-end flow:

1. Start both frontend and backend.
2. On the home screen, tap **Take Photo** (or **Choose from Gallery**) and pick a receipt image.
3. Confirm the preview, then tap **Extract Receipt**.
4. Wait for "Analyzing your receipt..." then the Review screen.
5. Edit any field, add/remove items, then tap **Save Record**.
6. Open **Saved Records**, tap a record to view details, delete it.

Edge cases to test:

- **Blurry image** — Should show: "We couldn't read this image clearly. Please take another photo."
- **Non-receipt image** — Should show: "This image does not appear to be a receipt. Please choose another image."
- **Missing field** — The AI returns null; the field is empty and editable in Review.
- **Network failure** — Stop the backend, try to extract: "Unable to connect. Please check your connection and try again."
- **API error** — Use an invalid key; a friendly error with Retry is shown.

## Error Handling

| Case | Response |
|---|---|
| Blurry / unreadable | "We couldn't read this image clearly. Please take another photo." |
| Not a receipt | "This image does not appear to be a receipt. Please choose another image." |
| Missing field | Field is left empty; the user enters it manually in Review. |
| Network failure | "Unable to connect. Please check your connection and try again." |
| API error | Friendly message with a Retry button. |
| Slow response | Loading screen "Analyzing your receipt..."; duplicate requests disabled. |

The app never crashes on an invalid image or API failure.

## AI Prompt

See `prompts/receipt-extraction.md`. The prompt instructs the model to:

- Determine whether the image is a receipt.
- Extract merchant, date, total, and line items (name, quantity, price).
- Never guess — return null for unreadable fields.
- Return structured JSON matching the schema.

The backend loads this prompt file at request time and passes it as the system message to OpenAI with `response_format: json_object` and `temperature: 0`.

## Technical Trade-offs

- **React for the frontend** — Component-based architecture fits a multi-screen, stateful app like this. TypeScript adds safety for the structured receipt data. Vite gives fast HMR and a production build.
- **Node/Express for the backend** — A thin Node proxy is the simplest way to call the OpenAI API without exposing the key to the browser. Express keeps the surface small (one `POST /extract` route) and is easy to deploy anywhere.
- **localStorage instead of a database** — The assignment requires local persistence only; localStorage is zero-setup, synchronous, and sufficient for a single user's receipts. It would not scale beyond one device.
- **AI via the backend** — Keeps the API key off the client, allows server-side validation of the AI response, and centralizes prompt management in one file. The frontend never talks to OpenAI directly.

