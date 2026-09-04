import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import type { ReceiptItem } from '@/types';
import { generateId } from '@/utils/helpers';

interface Props {
  initialMerchant: string;
  initialDate: string;
  initialTotal: string;
  initialItems: ReceiptItem[];
  onSave: (data: { merchant: string; date: string; total: string; items: ReceiptItem[] }) => void;
  onCancel: () => void;
}

export default function ReviewScreen({
  initialMerchant,
  initialDate,
  initialTotal,
  initialItems,
  onSave,
  onCancel,
}: Props) {
  const [merchant, setMerchant] = useState(initialMerchant);
  const [date, setDate] = useState(initialDate);
  const [total, setTotal] = useState(initialTotal);
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);

  const updateItem = (id: string, field: keyof ReceiptItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: generateId(), name: '', quantity: '1', price: '' }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Review &amp; Correct</h1>
      </header>

      <div className="flex-1 px-5 py-6 space-y-6 pb-24">
        <p className="text-sm text-gray-500 -mt-2">
          Check the extracted details below. Tap any field to edit it before saving.
        </p>

        {/* Merchant + Date */}
        <div className="bg-white rounded-2xl p-5 space-y-4 border border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Merchant
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Enter merchant name"
              className="w-full text-gray-900 border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-gray-900 border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Total
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.00"
              className="w-full text-gray-900 border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Line Items
            </h2>
            <span className="text-xs text-gray-400">{items.length} items</span>
          </div>

          <div className="space-y-2.5">
            {items.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No items yet. Add one below.</p>
              </div>
            )}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3 border border-gray-100 flex items-start gap-2"
              >
                <div className="flex items-center pt-2.5 text-gray-300">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-semibold text-gray-400 ml-0.5">{index + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder="Item name"
                    className="col-span-12 text-gray-900 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="col-span-4 text-gray-900 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    placeholder="Price"
                    className="col-span-8 text-gray-900 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 mt-0.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-white text-emerald-700 font-medium py-3 rounded-2xl border border-dashed border-emerald-300 hover:bg-emerald-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
        <button
          onClick={() => onSave({ merchant, date, total, items })}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Save className="w-5 h-5" />
          Save Record
        </button>
      </div>
    </div>
  );
}
