import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
  onBack: () => void;
}

export default function ErrorScreen({ message, onRetry, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto px-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 text-center">Something went wrong</h2>
      <p className="text-gray-500 mt-3 text-center leading-relaxed">{message}</p>

      <div className="flex gap-3 mt-8 w-full">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
