import { ArrowLeft, Trash2, Tag, Calendar, Receipt as ReceiptIcon } from 'lucide-react';
import type { Receipt } from '@/types';
import { formatDate, formatCurrency } from '@/utils/helpers';

interface Props {
  record: Receipt;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function RecordDetail({ record, onBack, onDelete }: Props) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Receipt Details</h1>
        <button
          onClick={() => onDelete(record.id)}
          className="ml-auto p-2.5 -mr-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Delete record"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 px-5 py-6 space-y-6">
        {record.imageDataUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white">
            <img src={record.imageDataUrl} alt="Receipt" className="w-full object-contain max-h-64" />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 space-y-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Merchant</p>
              <p className="text-gray-900 font-medium">{record.merchant || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</p>
              <p className="text-gray-900 font-medium">{formatDate(record.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ReceiptIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-gray-900 font-medium">{formatCurrency(record.total)}</p>
            </div>
          </div>
        </div>

        {record.items.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Line Items
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {record.items.map((item, i) => (
                <div key={item.id} className="flex items-center px-4 py-3.5">
                  <span className="w-6 text-xs font-semibold text-gray-300">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">{item.name || '—'}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity || '—'}</p>
                  </div>
                  <p className="text-gray-700 font-medium ml-2">{formatCurrency(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
