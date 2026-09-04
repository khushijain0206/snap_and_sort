import { ArrowLeft, Trash2, Inbox } from 'lucide-react';
import type { Receipt } from '@/types';
import { formatDate, formatCurrency } from '@/utils/helpers';

interface Props {
  records: Receipt[];
  onBack: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SavedRecords({ records, onBack, onOpen, onDelete }: Props) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Saved Records</h1>
        {records.length > 0 && (
          <span className="ml-auto text-sm text-gray-400">{records.length}</span>
        )}
      </header>

      <div className="flex-1 px-5 py-6">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No saved records</h2>
            <p className="text-gray-500 mt-2 max-w-xs">
              Capture a receipt and save it to see it appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
              >
                <button
                  onClick={() => onOpen(record.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-sm">
                      {record.merchant ? record.merchant.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {record.merchant || 'Unknown merchant'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(record.date)} · {formatCurrency(record.total)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label="Delete record"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
