import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto px-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Analyzing your receipt...</h2>
      <p className="text-gray-500 mt-2 text-center">
        This usually takes a few seconds. Please wait.
      </p>
    </div>
  );
}
