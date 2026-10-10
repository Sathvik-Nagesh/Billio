import React, { useState, useRef, useEffect } from 'react';
import { Upload, Edit3, Sliders, RotateCcw, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface SignatureEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  initialValue?: string;
  title?: string;
}

export function SignatureEditorModal({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title = 'Signature & Stamp Studio'
}: SignatureEditorModalProps) {
  const [tab, setTab] = useState<'draw' | 'upload'>('draw');
  
  // Drawing Canvas State
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Upload & Contrast Processing State
  const [sourceImage, setSourceImage] = useState<string | null>(initialValue || null);
  const [contrast, setContrast] = useState(150); // percentage 100 - 300
  const [brightness, setBrightness] = useState(110); // percentage 50 - 200
  const [threshold, setThreshold] = useState(160); // 0 - 255 binarize
  const [autoEnhance, setAutoEnhance] = useState(true);
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Drawing Canvas
  useEffect(() => {
    if (!isOpen || tab !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;

    // If initial value exists, load it
    if (initialValue && !hasDrawn) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialValue;
    }
  }, [isOpen, tab]);

  // Process uploaded image with contrast/binarization
  useEffect(() => {
    if (!sourceImage || tab !== 'upload') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Max dimensions for signature
      const maxWidth = 500;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Pixel manipulation for paper background removal and ink darkening
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const bOffset = (brightness - 100) * 1.5;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Grayscale luminance
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // 2. Brightness & Contrast
        gray = cFactor * (gray - 128) + 128 + bOffset;

        if (autoEnhance) {
          // Smart Binarization / Background removal:
          // Paper is light (gray > threshold) -> make transparent
          // Ink is dark (gray <= threshold) -> make solid dark ink
          if (gray > threshold) {
            data[i + 3] = 0; // Transparent paper
          } else {
            // Dark ink
            const alpha = Math.min(255, ((threshold - gray) / threshold) * 255 * 2);
            data[i] = 15;     // Deep ink blue-black
            data[i + 1] = 23;
            data[i + 2] = 42;
            data[i + 3] = alpha;
          }
        } else {
          data[i] = Math.max(0, Math.min(255, gray));
          data[i + 1] = Math.max(0, Math.min(255, gray));
          data[i + 2] = Math.max(0, Math.min(255, gray));
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
    img.src = sourceImage;
  }, [sourceImage, contrast, brightness, threshold, autoEnhance, tab]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearDraw = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { optimizeImage } = await import('@/lib/utils/imageOptimizer');
      const optimized = await optimizeImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.9, preserveTransparency: true });
      setSourceImage(optimized);
      setTab('upload');
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target?.result as string);
        setTab('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (tab === 'draw') {
      const canvas = drawCanvasRef.current;
      if (!canvas || !hasDrawn) {
        onClose();
        return;
      }
      onSave(canvas.toDataURL('image/png'));
    } else {
      const canvas = previewCanvasRef.current;
      if (!canvas || !sourceImage) {
        onClose();
        return;
      }
      onSave(canvas.toDataURL('image/png'));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)] flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Draw signature or upload photo with auto-contrast</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 mx-4 mt-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl">
          <button
            type="button"
            onClick={() => setTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'draw'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Edit3 size={14} />
            <span>Draw with Finger / Pen</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'upload'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Upload size={14} />
            <span>Upload Photo & Clean</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'draw' ? (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] bg-white rounded-2xl h-48 sm:h-56 touch-none cursor-crosshair flex items-center justify-center overflow-hidden">
                <canvas
                  ref={drawCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full"
                />
                {!hasDrawn && (
                  <div className="absolute pointer-events-none text-center text-xs text-gray-400 font-medium">
                    ✍️ Sign with finger or mouse here
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Smooth digital ink smoothing enabled</span>
                <button
                  type="button"
                  onClick={handleClearDraw}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Clear Pad</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!sourceImage ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-2xl h-48 bg-[var(--color-surface-secondary)] cursor-pointer p-4 text-center transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary)] flex items-center justify-center mb-2">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    Take photo or upload paper signature
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] mt-1">
                    Smart contrast will automatically remove background shadows and make ink pitch dark.
                  </span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
                </label>
              ) : (
                <div className="space-y-3">
                  {/* Cleaned Signature Canvas Preview */}
                  <div className="p-3 bg-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border)] flex flex-col items-center">
                    <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>Transparent Clean Preview</span>
                    </div>
                    <div className="w-full h-36 bg-[repeating-conic-gradient(#e2e8f0_0_25%,_#ffffff_0_50%)] dark:bg-[repeating-conic-gradient(#1e1c38_0_25%,_#0f0e1a_0_50%)] [background-size:16px_16px] rounded-xl flex items-center justify-center p-2 border border-[var(--color-border)] overflow-hidden">
                      <canvas ref={previewCanvasRef} className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>

                  {/* Contrast & Ink Controls */}
                  <div className="space-y-2.5 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1">
                        <Sliders size={13} />
                        <span>Background Removal / Ink Darkness</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setAutoEnhance(!autoEnhance)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          autoEnhance
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {autoEnhance ? '✓ Smart Clean Active' : 'Grayscale Only'}
                      </button>
                    </div>

                    {autoEnhance && (
                      <div>
                        <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
                          <span>Remove Paper Shadow</span>
                          <span className="font-mono font-bold">{threshold}</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="230"
                          value={threshold}
                          onChange={e => setThreshold(parseInt(e.target.value))}
                          className="w-full accent-[var(--color-primary)]"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
                        <span>Ink Contrast</span>
                        <span className="font-mono font-bold">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="250"
                        value={contrast}
                        onChange={e => setContrast(parseInt(e.target.value))}
                        className="w-full accent-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--color-primary)] cursor-pointer hover:underline">
                      Upload different photo
                      <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 font-bold">
            <Check size={14} />
            <span>Apply Signature</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
