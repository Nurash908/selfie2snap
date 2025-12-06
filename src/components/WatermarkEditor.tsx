import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  X,
  Download,
  Type,
  Move,
  Paintbrush,
  Eye,
  RotateCcw,
  Save,
  Trash2,
  Bookmark,
  Instagram,
  Copyright,
  AtSign,
  Sparkles,
  Plus,
} from "lucide-react";

interface WatermarkEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

interface WatermarkPreset {
  id: string;
  name: string;
  text: string;
  position: Position;
  fontSize: number;
  opacity: number;
  color: string;
  icon: "social" | "copyright" | "brand" | "custom";
}

const DEFAULT_PRESETS: WatermarkPreset[] = [
  {
    id: "instagram",
    name: "Instagram Handle",
    text: "@yourhandle",
    position: "bottom-right",
    fontSize: 20,
    opacity: 80,
    color: "#ffffff",
    icon: "social",
  },
  {
    id: "copyright",
    name: "Copyright Notice",
    text: "© 2024 Your Name",
    position: "bottom-left",
    fontSize: 16,
    opacity: 60,
    color: "#ffffff",
    icon: "copyright",
  },
  {
    id: "brand",
    name: "Brand Watermark",
    text: "Selfie2Snap",
    position: "bottom-right",
    fontSize: 24,
    opacity: 70,
    color: "#a855f7",
    icon: "brand",
  },
  {
    id: "minimal",
    name: "Minimal Signature",
    text: "•",
    position: "bottom-right",
    fontSize: 32,
    opacity: 40,
    color: "#ffffff",
    icon: "custom",
  },
];

const POSITIONS: { id: Position; label: string }[] = [
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "center", label: "Center" },
];

const COLORS = [
  { id: "white", value: "#ffffff", label: "White" },
  { id: "black", value: "#000000", label: "Black" },
  { id: "primary", value: "#a855f7", label: "Primary" },
  { id: "accent", value: "#ec4899", label: "Accent" },
];

const getPresetIcon = (icon: string) => {
  switch (icon) {
    case "social":
      return <Instagram className="w-4 h-4" />;
    case "copyright":
      return <Copyright className="w-4 h-4" />;
    case "brand":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <AtSign className="w-4 h-4" />;
  }
};

const WatermarkEditor = ({ imageUrl, isOpen, onClose }: WatermarkEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("Selfie2Snap");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(70);
  const [color, setColor] = useState("#ffffff");
  const [isProcessing, setIsProcessing] = useState(false);
  const [presets, setPresets] = useState<WatermarkPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Load saved presets and preferences
  useEffect(() => {
    const savedPresets = localStorage.getItem("watermark-presets");
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to load presets");
      }
    }

    const saved = localStorage.getItem("watermark-preferences");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setText(prefs.text || "Selfie2Snap");
        setPosition(prefs.position || "bottom-right");
        setFontSize(prefs.fontSize || 24);
        setOpacity(prefs.opacity || 70);
        setColor(prefs.color || "#ffffff");
      } catch (e) {
        console.error("Failed to load watermark preferences");
      }
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback(() => {
    localStorage.setItem(
      "watermark-preferences",
      JSON.stringify({ text, position, fontSize, opacity, color })
    );
  }, [text, position, fontSize, opacity, color]);

  // Apply preset
  const applyPreset = (preset: WatermarkPreset) => {
    setText(preset.text);
    setPosition(preset.position);
    setFontSize(preset.fontSize);
    setOpacity(preset.opacity);
    setColor(preset.color);
    setSelectedPreset(preset.id);
  };

  // Save custom preset
  const saveCustomPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    const newPreset: WatermarkPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      text,
      position,
      fontSize,
      opacity,
      color,
      icon: "custom",
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem("watermark-presets", JSON.stringify(updatedPresets));
    setNewPresetName("");
    setShowSaveDialog(false);
    toast.success("Preset saved!");
  };

  // Delete custom preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem("watermark-presets", JSON.stringify(updatedPresets));
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    }
    toast.success("Preset deleted");
  };

  // Draw watermark preview
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity / 100;

      const padding = 20;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      let x: number, y: number;

      switch (position) {
        case "top-left":
          x = padding;
          y = padding + textHeight;
          break;
        case "top-right":
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
          break;
        case "bottom-left":
          x = padding;
          y = canvas.height - padding;
          break;
        case "bottom-right":
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case "center":
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2 + textHeight / 2;
          break;
        default:
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
      }

      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(text, x, y);
    };
    img.src = imageUrl;
  }, [imageUrl, text, position, fontSize, opacity, color]);

  useEffect(() => {
    if (isOpen) {
      drawWatermark();
    }
  }, [isOpen, drawWatermark]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    savePreferences();

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `selfie2snap-watermarked-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded with watermark!");
      onClose();
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setText("Selfie2Snap");
    setPosition("bottom-right");
    setFontSize(24);
    setOpacity(70);
    setColor("#ffffff");
    setSelectedPreset(null);
  };

  const allPresets = [...DEFAULT_PRESETS, ...presets];

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
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Type className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Watermark Editor</h2>
                  <p className="text-xs text-muted-foreground">Add custom watermarks to your images</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4 p-4 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Presets Panel */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Bookmark className="w-4 h-4 text-primary" />
                    Presets
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {allPresets.map((preset) => (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 rounded-xl cursor-pointer transition-all group ${
                        selectedPreset === preset.id
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-secondary/30 border border-border hover:border-primary/50"
                      }`}
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedPreset === preset.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {getPresetIcon(preset.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{preset.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{preset.text}</p>
                        </div>
                      </div>
                      {preset.id.startsWith("custom-") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Save Preset Dialog */}
                <AnimatePresence>
                  {showSaveDialog && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2"
                    >
                      <Input
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-7"
                          onClick={() => setShowSaveDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7"
                          onClick={saveCustomPreset}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Preview */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Preview
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50 border border-border">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="md:col-span-2 space-y-5">
                {/* Text input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Type className="w-4 h-4 text-primary" />
                    Watermark Text
                  </label>
                  <Input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setSelectedPreset(null);
                    }}
                    placeholder="Enter watermark text"
                    className="bg-secondary/50"
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Move className="w-4 h-4 text-primary" />
                    Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map((pos) => (
                      <Button
                        key={pos.id}
                        variant={position === pos.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setPosition(pos.id);
                          setSelectedPreset(null);
                        }}
                        className="text-xs"
                      >
                        {pos.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary" />
                      Font Size
                    </span>
                    <span className="text-muted-foreground">{fontSize}px</span>
                  </label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => {
                      setFontSize(v);
                      setSelectedPreset(null);
                    }}
                    min={12}
                    max={72}
                    step={2}
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Opacity
                    </span>
                    <span className="text-muted-foreground">{opacity}%</span>
                  </label>
                  <Slider
                    value={[opacity]}
                    onValueChange={([v]) => {
                      setOpacity(v);
                      setSelectedPreset(null);
                    }}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Paintbrush className="w-4 h-4 text-primary" />
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setColor(c.value);
                          setSelectedPreset(null);
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          color === c.value
                            ? "border-primary scale-110"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        setSelectedPreset(null);
                      }}
                      className="w-10 h-10 rounded-full cursor-pointer border-2 border-border"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Preset
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="premium"
                  onClick={handleDownload}
                  disabled={isProcessing || !text}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download with Watermark
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatermarkEditor;
