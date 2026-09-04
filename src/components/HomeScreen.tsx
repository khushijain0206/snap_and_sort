import { Camera, ImageIcon, FolderOpen } from 'lucide-react';

interface Props {
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onOpenSavedRecords: () => void;
  savedCount: number;
}

export default function HomeScreen({ onTakePhoto, onChooseFromGallery, onOpenSavedRecords, savedCount }: Props) {
  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-12 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center mb-12 mt-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-600/20">
          <Camera className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Snap &amp; Sort</h1>
        <p className="text-gray-500 mt-3 leading-relaxed max-w-xs">
          Capture a receipt, let AI extract the details, then review and save your records.
        </p>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onTakePhoto}
          className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Camera className="w-5 h-5" />
          Take Photo
        </button>

        <button
          onClick={onChooseFromGallery}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-4 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <ImageIcon className="w-5 h-5 text-emerald-600" />
          Choose from Gallery
        </button>

        <button
          onClick={onOpenSavedRecords}
          className="w-full flex items-center justify-center gap-3 bg-transparent text-gray-600 font-medium py-4 rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all"
        >
          <FolderOpen className="w-5 h-5" />
          Saved Records
          {savedCount > 0 && (
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-auto pt-12 text-center">
        Your receipts are stored locally on this device.
      </p>
    </div>
  );
}
