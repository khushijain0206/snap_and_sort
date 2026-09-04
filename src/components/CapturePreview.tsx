import { ArrowLeft, Sparkles } from 'lucide-react';

interface Props {
  imagePreview: string;
  onBack: () => void;
  onExtract: () => void;
  isExtracting: boolean;
}

export default function CapturePreview({ imagePreview, onBack, onExtract, isExtracting }: Props) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Preview</h1>
      </header>

      <div className="flex-1 flex flex-col px-5 py-6">
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          <img
            src={imagePreview}
            alt="Receipt preview"
            className="max-w-full max-h-[55vh] object-contain"
          />
        </div>

        <button
          onClick={onExtract}
          disabled={isExtracting}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {isExtracting ? 'Analyzing...' : 'Extract Receipt'}
        </button>
      </div>
    </div>
  );
}
