import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  X,
  Download,
  Sparkles,
  Sun,
  Contrast,
  Palette,
  Zap,
  RotateCcw,
  Loader2,
  Check,
  Wand2,
  Gem,
  Moon,
  Mountain,
  User,
  Camera,
} from "lucide-react";

interface ImageEnhancerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EnhancementSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  warmth: number;
  vibrance: number;
}

const DEFAULT_SETTINGS: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  warmth: 0,
  vibrance: 0,
};

const AUTO_ENHANCE_PRESETS = [
  {
    id: "auto",
    name: "AI Auto",
    icon: Wand2,
    description: "Smart enhancement",
    settings: { brightness: 5, contrast: 10, saturation: 8, sharpness: 15, warmth: 3, vibrance: 12 },
    gradient: "from-primary to-accent",
  },
  {
    id: "portrait",
    name: "Portrait",
    icon: User,
    description: "Skin-friendly",
    settings: { brightness: 8, contrast: 8, saturation: 5, sharpness: 12, warmth: 6, vibrance: 8 },
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "landscape",
    name: "Landscape",
    icon: Mountain,
    description: "Nature tones",
    settings: { brightness: 5, contrast: 15, saturation: 20, sharpness: 20, warmth: 2, vibrance: 25 },
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "night",
    name: "Night Mode",
    icon: Moon,
    description: "Low light fix",
    settings: { brightness: 15, contrast: 12, saturation: 8, sharpness: 18, warmth: -5, vibrance: 10 },
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    id: "hdr",
    name: "HDR Effect",
    icon: Camera,
    description: "Dynamic range",
    settings: { brightness: 3, contrast: 30, saturation: 15, sharpness: 25, warmth: 0, vibrance: 20 },
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "vivid",
    name: "Vivid",
    icon: Palette,
    description: "Bold colors",
    settings: { brightness: 3, contrast: 15, saturation: 25, sharpness: 10, warmth: -5, vibrance: 30 },
    gradient: "from-red-500 to-yellow-500",
  },
  {
    id: "cinematic",
    name: "Cinematic",
    icon: Gem,
    description: "Film look",
    settings: { brightness: -3, contrast: 20, saturation: -10, sharpness: 8, warmth: 8, vibrance: -5 },
    gradient: "from-slate-500 to-zinc-600",
  },
  {
    id: "bright",
    name: "Bright",
    icon: Sun,
    description: "Light & airy",
    settings: { brightness: 15, contrast: 5, saturation: 5, sharpness: 5, warmth: 5, vibrance: 10 },
    gradient: "from-yellow-400 to-orange-400",
  },
];

const ImageEnhancer = ({ imageUrl, isOpen, onClose }: ImageEnhancerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<EnhancementSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false);

  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        originalImageRef.current = img;
        applyEnhancements();
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (originalImageRef.current) {
      applyEnhancements();
    }
  }, [settings]);

  const applyEnhancements = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const brightness = settings.brightness * 2.55;
      r += brightness;
      g += brightness;
      b += brightness;

      const contrast = (settings.contrast + 100) / 100;
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      const satFactor = (settings.saturation + 100) / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);

      const warmth = settings.warmth;
      r += warmth * 1.5;
      g += warmth * 0.5;
      b -= warmth * 1.5;

      const vibrance = settings.vibrance / 100;
      const maxChannel = Math.max(r, g, b);
      const avgChannel = (r + g + b) / 3;
      const vibranceAmount = (maxChannel - avgChannel) / 255 * vibrance;
      r += (r - avgChannel) * vibranceAmount;
      g += (g - avgChannel) * vibranceAmount;
      b += (b - avgChannel) * vibranceAmount;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);

    if (settings.sharpness > 0) {
      applySharpening(ctx, canvas.width, canvas.height, settings.sharpness / 100);
    }
  }, [settings]);

  const applySharpening = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const center = tempData[idx + c];
          const neighbors =
            (tempData[((y - 1) * width + x) * 4 + c] +
              tempData[((y + 1) * width + x) * 4 + c] +
              tempData[(y * width + x - 1) * 4 + c] +
              tempData[(y * width + x + 1) * 4 + c]) /
            4;

          const sharpened = center + (center - neighbors) * amount;
          data[idx + c] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleAutoEnhance = async () => {
    setIsAutoEnhancing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const autoPreset = AUTO_ENHANCE_PRESETS[0];
    setSettings(autoPreset.settings);
    setSelectedPreset("auto");
    setIsAutoEnhancing(false);
    toast.success("AI enhancement applied!");
  };

  const applyPreset = (preset: typeof AUTO_ENHANCE_PRESETS[0]) => {
    setSettings(preset.settings);
    setSelectedPreset(preset.id);
    toast.success(`${preset.name} preset applied`);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedPreset(null);
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `selfie2snap-enhanced-${Date.now()}.png`;
      link.click();
      toast.success("Enhanced image downloaded!");
      onClose();
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSetting = (key: keyof EnhancementSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(null);
  };

  const sliderControls = [
    { key: "brightness" as const, label: "Brightness", icon: Sun, min: -50, max: 50 },
    { key: "contrast" as const, label: "Contrast", icon: Contrast, min: -50, max: 50 },
    { key: "saturation" as const, label: "Saturation", icon: Palette, min: -50, max: 50 },
    { key: "sharpness" as const, label: "Sharpness", icon: Zap, min: 0, max: 100 },
    { key: "warmth" as const, label: "Warmth", icon: Sun, min: -30, max: 30 },
    { key: "vibrance" as const, label: "Vibrance", icon: Sparkles, min: -50, max: 50 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-card border border-border/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">AI Image Enhancer</h2>
                  <p className="text-[10px] text-muted-foreground">Professional enhancements</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 h-8 text-xs">
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 p-5 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Preview</span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAutoEnhance}
                    disabled={isAutoEnhancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-medium shadow-md disabled:opacity-50"
                  >
                    {isAutoEnhancing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        AI Auto
                      </>
                    )}
                  </motion.button>
                </div>
                
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border/30">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                  {isAutoEnhancing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="text-center space-y-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-primary to-accent p-[2px]"
                        >
                          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                          </div>
                        </motion.div>
                        <p className="text-xs font-medium">Analyzing image...</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {AUTO_ENHANCE_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyPreset(preset)}
                      className={`relative p-2 rounded-lg border transition-all ${
                        selectedPreset === preset.id
                          ? "border-primary bg-primary/10"
                          : "border-border/30 bg-secondary/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${preset.gradient} flex items-center justify-center`}>
                          <preset.icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[9px] font-medium">{preset.name}</span>
                      </div>
                      {selectedPreset === preset.id && (
                        <motion.div
                          layoutId="preset-indicator"
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-2 h-2 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <span className="text-xs font-medium text-muted-foreground">Fine-tune</span>
                
                <div className="space-y-3">
                  {sliderControls.map((control) => (
                    <div key={control.key} className="space-y-1.5">
                      <label className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <control.icon className="w-3 h-3 text-primary" />
                          {control.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">
                          {settings[control.key] > 0 ? "+" : ""}
                          {settings[control.key]}
                        </span>
                      </label>
                      <Slider
                        value={[settings[control.key]]}
                        onValueChange={([v]) => updateSetting(control.key, v)}
                        min={control.min}
                        max={control.max}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-border/30 bg-secondary/20">
              <Button variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  size="sm"
                  className="gap-1.5 min-w-[140px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Download
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageEnhancer;
