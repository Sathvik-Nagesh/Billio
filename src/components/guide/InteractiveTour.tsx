import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, Check, Keyboard } from 'lucide-react';
import { useTourStore, MAIN_APP_TOUR_STEPS } from '@/stores/useTourStore';
import { Button } from '@/components/ui';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveTour() {
  const { isTourActive, currentStepIndex, nextStep, prevStep, skipTour, endTour } = useTourStore();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = MAIN_APP_TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === MAIN_APP_TOUR_STEPS.length - 1;

  // Calculate position of the spotlighted element
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Ensure element is visible in viewport
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // Fallback to center if element not on page
        setTargetRect({
          top: window.innerHeight / 2 - 50,
          left: window.innerWidth / 2 - 150,
          width: 300,
          height: 100,
        });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isTourActive, currentStepIndex, currentStep]);

  // Keyboard navigation for tour
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, nextStep, prevStep, skipTour]);

  if (!isTourActive || !currentStep || !targetRect) return null;

  // Position tooltip relative to target rect
  const padding = 12;
  let tooltipTop = targetRect.top + targetRect.height + padding;
  let tooltipLeft = Math.max(16, Math.min(window.innerWidth - 380, targetRect.left));

  // Adjust if overflow bottom
  if (tooltipTop + 240 > window.innerHeight) {
    tooltipTop = Math.max(16, targetRect.top - 240 - padding);
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden animate-fade-in">
      {/* SVG Cutout Backdrop */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={Math.max(0, targetRect.left - 6)}
              y={Math.max(0, targetRect.top - 6)}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="16"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Highlight Pulsing Ring */}
      <div
        className="absolute rounded-2xl ring-4 ring-[var(--color-primary)] ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300 animate-pulse"
        style={{
          top: Math.max(0, targetRect.top - 6),
          left: Math.max(0, targetRect.left - 6),
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />

      {/* Floating Tour Tooltip Card */}
      <div
        ref={tooltipRef}
        className="absolute w-[360px] max-w-[calc(100vw-32px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-2xl p-5 z-[101] transition-all duration-300 backdrop-blur-md animate-fade-in-up"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary)] flex items-center justify-center shrink-0 font-bold text-xs">
              {currentStepIndex + 1}
            </div>
            <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
              {currentStep.title}
            </h4>
          </div>
          <button
            onClick={skipTour}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-all"
            title="Exit tour (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Action Hint / Shortcut */}
        {currentStep.actionHint && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] mb-4 text-[11px] text-[var(--color-text-primary)] font-mono">
            <Keyboard size={13} className="text-[var(--color-primary)]" />
            <span>{currentStep.actionHint}</span>
          </div>
        )}

        {/* Footer with Step Dots and Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {MAIN_APP_TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? 'w-5 bg-[var(--color-primary)]'
                    : 'w-1.5 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="h-8 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] text-xs font-semibold text-[var(--color-text-primary)] transition-all flex items-center gap-1"
              >
                <ArrowLeft size={13} /> Back
              </button>
            )}

            {!isLastStep ? (
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 px-3 rounded-xl gap-1 text-xs shadow-xs"
              >
                Next <ArrowRight size={13} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={endTour}
                className="h-8 px-3 rounded-xl gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Check size={13} /> Got It!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
