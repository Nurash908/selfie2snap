import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  X,
  Download,
  ZoomIn,
  Maximize2,
  Loader2,
  Check,
} from "lucide-react";

interface ImageUpscalerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

type ScaleFactor = 1.5 | 2 | 3 | 4;

const SCALE_OPTIONS: { factor: ScaleFactor; label: string; description: string }[] = [
  { factor: 1.5, label: "1.5x", description: "Small boost" },
  { factor: 2, label: "2x", description: "Recommended" },
  { factor: 3, label: "3x", description: "High quality" },
  { factor: 4, label: "4x", description: "Maximum" },
];

const ImageUpscaler = ({ imageUrl, isOpen, onClose }: ImageUpscalerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [previewReady, setPreviewReady] = useState(false);

  const loadImage = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setPreviewReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useState(() => {
    if (isOpen) {
      loadImage();
    }
  });

  const upscaleImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const newWidth = Math.round(img.width * scaleFactor);
      const newHeight = Math.round(img.height * scaleFactor);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Enable image smoothing for better upscaling quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw upscaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Apply sharpening for better perceived quality
      applySharpening(ctx, newWidth, newHeight);

      toast.success(`Image upscaled to ${newWidth}x${newHeight}px`);
    } catch (error) {
      console.error("Upscaling error:", error);
      toast.error("Failed to upscale image");
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, scaleFactor]);

  const applySharpening = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Simple unsharp mask for enhanced perceived sharpness
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    const sharpenAmount = 0.3;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          const center = tempData[idx + c];
          const neighbors = (
            tempData[((y - 1) * width + x) * 4 + c] +
            tempData[((y + 1) * width + x) * 4 + c] +
            tempData[(y * width + x - 1) * 4 + c] +
            tempData[(y * width + x + 1) * 4 + c]
          ) / 4;
          
          const sharpened = center + (center - neighbors) * sharpenAmount;
          data[idx + c] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleDownload = async () => {
    await upscaleImage();
    
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `selfie2snap-upscaled-${scaleFactor}x-${Date.now()}.png`;
      link.click();
      toast.success("Upscaled image downloaded!");
      onClose();
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const newWidth = Math.round(originalDimensions.width * scaleFactor);
  const newHeight = Math.round(originalDimensions.height * scaleFactor);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upscale Image</h2>
                  <p className="text-xs text-muted-foreground">Enhance resolution with AI</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/30 border border-border">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Dimensions info */}
              {previewReady && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-8 p-4 glass rounded-xl"
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Original</p>
                    <p className="font-mono text-sm font-semibold">
                      {originalDimensions.width} × {originalDimensions.height}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-[2px] bg-gradient-to-r from-primary to-accent" />
                    <ZoomIn className="w-5 h-5 text-primary" />
                    <div className="w-8 h-[2px] bg-gradient-to-r from-accent to-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Upscaled</p>
                    <p className="font-mono text-sm font-semibold text-primary">
                      {newWidth} × {newHeight}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Scale options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <ZoomIn className="w-4 h-4 text-primary" />
                  Scale Factor
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {SCALE_OPTIONS.map((option) => (
                    <motion.button
                      key={option.factor}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setScaleFactor(option.factor)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        scaleFactor === option.factor
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-secondary/30"
                      }`}
                    >
                      {scaleFactor === option.factor && (
                        <motion.div
                          layoutId="scale-indicator"
                          className="absolute inset-0 rounded-xl bg-primary/5 border-2 border-primary"
                        />
                      )}
                      <div className="relative z-10">
                        <p className="text-lg font-bold">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {scaleFactor === option.factor && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleDownload}
                disabled={isProcessing}
                className="gap-2 min-w-[180px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download {scaleFactor}x
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageUpscaler;
