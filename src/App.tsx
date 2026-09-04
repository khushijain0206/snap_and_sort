import { useCallback, useRef, useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import CapturePreview from '@/components/CapturePreview';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import ReviewScreen from '@/components/ReviewScreen';
import SavedRecords from '@/components/SavedRecords';
import RecordDetail from '@/components/RecordDetail';
import { extractReceipt } from '@/services/api';
import { loadRecords, addRecord, deleteRecord } from '@/services/storage';
import { fileToDataUrl, generateId } from '@/utils/helpers';
import type { Receipt, ReceiptItem, ExtractionResult } from '@/types';

type Screen =
  | 'home'
  | 'preview'
  | 'loading'
  | 'error'
  | 'review'
  | 'saved'
  | 'detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [records, setRecords] = useState<Receipt[]>(() => loadRecords());
  const [imagePreview, setImagePreview] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewData, setReviewData] = useState<{
    merchant: string;
    date: string;
    total: string;
    items: ReceiptItem[];
  } | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setPendingFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
    } catch {
      setImagePreview('');
    }
    setScreen('preview');
  }, []);

  const onCameraChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
      e.target.value = '';
    },
    [handleFileSelected],
  );

  const onGalleryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
      e.target.value = '';
    },
    [handleFileSelected],
  );

  const handleExtract = useCallback(async () => {
    if (!pendingFile) return;
    setScreen('loading');
    try {
      const result: ExtractionResult = await extractReceipt(pendingFile);

      if (result.document_type === 'not_receipt') {
        setErrorMessage('This image does not appear to be a receipt. Please choose another image.');
        setScreen('error');
        return;
      }
      if (result.document_type === 'unreadable') {
        setErrorMessage("We couldn't read this image clearly. Please take another photo.");
        setScreen('error');
        return;
      }

      setReviewData({
        merchant: result.merchant ?? '',
        date: result.date ?? '',
        total: result.total ?? '',
        items: (result.items ?? []).map((item) => ({
          id: generateId(),
          name: item.name ?? '',
          quantity: item.quantity ?? '1',
          price: item.price ?? '',
        })),
      });
      setScreen('review');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'API_ERROR';
      if (msg === 'NETWORK_FAILURE') {
        setErrorMessage('Unable to connect. Please check your connection and try again.');
      } else if (msg === 'MISSING_API_KEY') {
        setErrorMessage('The OpenAI API key is not configured. Please add OPENAI_API_KEY to Bolt Secrets (Project Settings > Secrets), then try again.');
      } else if (msg === 'INVALID_API_KEY') {
        setErrorMessage('The OpenAI API key is invalid. Please check the OPENAI_API_KEY value in Bolt Secrets.');
      } else if (msg === 'OPENAI_QUOTA') {
        setErrorMessage('The OpenAI account has no available API quota. Please add billing or credits to the OpenAI account, then try again.');
      } else if (msg === 'RATE_LIMIT') {
        setErrorMessage('The AI service is busy. Please try again in a moment.');
      } else {
        setErrorMessage('Something went wrong while analyzing the receipt. Please try again.');
      }
      setScreen('error');
    }
  }, [pendingFile]);

  const handleSave = useCallback(
    (data: { merchant: string; date: string; total: string; items: ReceiptItem[] }) => {
      const record: Receipt = {
        id: generateId(),
        merchant: data.merchant,
        date: data.date,
        total: data.total,
        items: data.items,
        imageDataUrl: imagePreview,
        createdAt: Date.now(),
      };
      const updated = addRecord(record);
      setRecords(updated);
      setReviewData(null);
      setPendingFile(null);
      setImagePreview('');
      setActiveRecordId(record.id);
      setScreen('detail');
    },
    [imagePreview],
  );

  const handleDeleteRecord = useCallback(
    (id: string) => {
      const updated = deleteRecord(id);
      setRecords(updated);
      setActiveRecordId(null);
      setScreen('saved');
    },
    [],
  );

  const activeRecord = activeRecordId ? records.find((r) => r.id === activeRecordId) : undefined;

  // Hidden file inputs
  const fileInputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCameraChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onGalleryChange}
        className="hidden"
      />
    </>
  );

  switch (screen) {
    case 'home':
      return (
        <div className="bg-white min-h-screen">
          {fileInputs}
          <HomeScreen
            onTakePhoto={() => cameraInputRef.current?.click()}
            onChooseFromGallery={() => galleryInputRef.current?.click()}
            onOpenSavedRecords={() => setScreen('saved')}
            savedCount={records.length}
          />
        </div>
      );

    case 'preview':
      return (
        <div className="bg-white min-h-screen">
          {fileInputs}
          <CapturePreview
            imagePreview={imagePreview}
            onBack={() => {
              setPendingFile(null);
              setImagePreview('');
              setScreen('home');
            }}
            onExtract={handleExtract}
            isExtracting={false}
          />
        </div>
      );

    case 'loading':
      return <LoadingScreen />;

    case 'error':
      return (
        <ErrorScreen
          message={errorMessage}
          onRetry={pendingFile ? handleExtract : undefined}
          onBack={() => {
            setPendingFile(null);
            setImagePreview('');
            setScreen('home');
          }}
        />
      );

    case 'review':
      if (!reviewData) {
        setScreen('home');
        return null;
      }
      return (
        <ReviewScreen
          initialMerchant={reviewData.merchant}
          initialDate={reviewData.date}
          initialTotal={reviewData.total}
          initialItems={reviewData.items}
          onSave={handleSave}
          onCancel={() => setScreen('preview')}
        />
      );

    case 'saved':
      return (
        <SavedRecords
          records={records}
          onBack={() => setScreen('home')}
          onOpen={(id) => {
            setActiveRecordId(id);
            setScreen('detail');
          }}
          onDelete={handleDeleteRecord}
        />
      );

    case 'detail':
      if (!activeRecord) {
        setScreen('saved');
        return null;
      }
      return (
        <RecordDetail
          record={activeRecord}
          onBack={() => setScreen('saved')}
          onDelete={handleDeleteRecord}
        />
      );

    default:
      return null;
  }
}
