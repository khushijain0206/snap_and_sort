export interface ReceiptItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string;
  total: string;
  items: ReceiptItem[];
  imageDataUrl?: string;
  createdAt: number;
}

export interface ExtractionResult {
  document_type: 'receipt' | 'not_receipt' | 'unreadable';
  merchant?: string | null;
  date?: string | null;
  total?: string | null;
  items?: Array<{
    name: string | null;
    quantity: string | null;
    price: string | null;
  }>;
}
