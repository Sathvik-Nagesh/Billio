/**
 * Client-Side Image Optimizer & Quota Protector
 * Automatically compresses, resizes, and optimizes uploaded logos, stamps, and signatures
 * to prevent localStorage and memory quota exhaustion.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  preserveTransparency?: boolean;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  format: 'image/png',
  preserveTransparency: true,
};

/**
 * Optimizes an image File or Base64 data URL to an ultra-compact Base64 string
 */
export async function optimizeImage(
  input: File | Blob | string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-preserving dimensions
        if (width > (opts.maxWidth || 512) || height > (opts.maxHeight || 512)) {
          const ratio = Math.min(
            (opts.maxWidth || 512) / width,
            (opts.maxHeight || 512) / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }

        // Better image smoothing for crisp text & signatures
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        const outputFormat = opts.preserveTransparency ? 'image/png' : (opts.format || 'image/jpeg');
        const dataUrl = canvas.toDataURL(outputFormat, opts.quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Image optimization fallback:', err);
        // If canvas fails, fallback to original if string
        if (typeof input === 'string') resolve(input);
        else reject(err);
      }
    };

    img.onerror = (err) => {
      console.error('Failed to load image for optimization:', err);
      if (typeof input === 'string') resolve(input);
      else reject(err);
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Checks approximate size of Base64 string in kilobytes
 */
export function getBase64SizeInKB(base64String: string): number {
  if (!base64String) return 0;
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (stringLength * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}
