import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveBackground from "@/components/InteractiveBackground";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import FavoritesPanel from "@/components/FavoritesPanel";
import MusicControl from "@/components/MusicControl";
import AdBanner from "@/components/AdBanner";
import ComparisonSlider from "@/components/ComparisonSlider";
import SocialShare from "@/components/SocialShare";
import ImageLightbox from "@/components/ImageLightbox";
import ImageFilters from "@/components/ImageFilters";
import BatchDownload from "@/components/BatchDownload";
import WatermarkEditor from "@/components/WatermarkEditor";
import ImageUpscaler from "@/components/ImageUpscaler";
import ImageEnhancer from "@/components/ImageEnhancer";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Upload,
  Sparkles,
  Heart,
  Download,
  LogIn,
  LogOut,
  History,
  Camera,
  RefreshCw,
  User,
  Wand2,
  Zap,
  Star,
  Eye,
  Maximize2,
  Sliders,
  Type,
  ZoomIn,
  ArrowRight,
  Check,
  Crown,
} from "lucide-react";

const FRAME_STYLES = [
  { id: "romantic", label: "Romantic", emoji: "💕", color: "from-pink-500 to-rose-500" },
  { id: "cinematic", label: "Cinematic", emoji: "🎬", color: "from-amber-500 to-orange-500" },
  { id: "anime", label: "Anime", emoji: "🎨", color: "from-purple-500 to-pink-500" },
  { id: "vintage", label: "Vintage", emoji: "📷", color: "from-amber-600 to-yellow-500" },
  { id: "fantasy", label: "Fantasy", emoji: "✨", color: "from-violet-500 to-purple-500" },
  { id: "watercolor", label: "Watercolor", emoji: "🎭", color: "from-cyan-500 to-blue-500" },
  { id: "popart", label: "Pop Art", emoji: "🔴", color: "from-red-500 to-yellow-500" },
  { id: "cyberpunk", label: "Cyberpunk", emoji: "🌃", color: "from-cyan-400 to-fuchsia-500" },
];

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [portrait1, setPortrait1] = useState<string | null>(null);
  const [portrait2, setPortrait2] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(4);
  const [frameStyle, setFrameStyle] = useState("romantic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingFrame, setCurrentGeneratingFrame] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [upscaleImage, setUpscaleImage] = useState<string | null>(null);
  const [enhanceImage, setEnhanceImage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { playSound } = useSoundEffects();
  const { addToFavorites, isFavorite, favoritesCount, refreshFavorites } = useFavorites();

  const getProgress = () => {
    if (isGenerating) return 95;
    if (generatedImages.length > 0) return 100;
    if (portrait1 && portrait2) return 80;
    if (portrait1) return 40;
    return 0;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string | null) => void,
    isFirstPortrait: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playSound("upload");

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      toast.success(isFirstPortrait ? "First portrait uploaded!" : "Second portrait uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!portrait1 || !portrait2) {
      playSound("error");
      toast.error("Please upload both portraits first");
      return;
    }

    playSound("generate");
    setIsGenerating(true);
    setCurrentGeneratingFrame(0);
    setGeneratedImages([]);

    const newImages: string[] = [];

    try {
      for (let i = 0; i < frameCount; i++) {
        setCurrentGeneratingFrame(i + 1);
        
        console.log(`Generating frame ${i + 1} of ${frameCount}...`);

        const { data, error } = await supabase.functions.invoke('generate-snaps', {
          body: {
            portrait1,
            portrait2,
            frameStyle,
            frameIndex: i,
            totalFrames: frameCount,
          },
        });

        if (error) {
          console.error('Generation error:', error);
          toast.error(`Frame ${i + 1} failed: ${error.message}`);
          continue;
        }

        if (data?.imageUrl) {
          newImages.push(data.imageUrl);
          setGeneratedImages([...newImages]);
        } else if (data?.error) {
          console.error('API error:', data.error);
          toast.error(data.error);
        }
      }

      if (newImages.length > 0) {
        playSound("complete");
        toast.success(`Generated ${newImages.length} amazing snaps!`);
        
        if (user) {
          for (const imageUrl of newImages) {
            try {
              await supabase.from("generated_images").insert({
                image_url: imageUrl,
                user_id: user.id,
                prompt: `${frameStyle} style selfie`,
              });
            } catch (err) {
              console.error("Failed to save to history:", err);
            }
          }
        }
      } else {
        playSound("error");
        toast.error("Generation failed. Please try again.");
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      playSound("error");
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingFrame(0);
    }
  };

  const handleAddToFavorites = async (imageUrl: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      navigate("/auth");
      return;
    }

    playSound("favorite");
    const success = await addToFavorites(imageUrl, `${frameStyle} style selfie`);
    if (success) {
      refreshFavorites();
    }
  };

  const handleDownload = (imageUrl: string) => {
    playSound("download");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `selfie2snap-${Date.now()}.png`;
    link.click();
    toast.success("Download started!");
  };

  const handleReset = () => {
    playSound("click");
    setPortrait1(null);
    setPortrait2(null);
    setGeneratedImages([]);
    setSelectedComparison(null);
    toast.success("Workspace reset!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <InteractiveBackground />
      
      <AnimatePresence>
        {isGenerating && (
          <GeneratingAnimation frameCount={frameCount} currentFrame={currentGeneratingFrame} />
        )}
      </AnimatePresence>

      <FavoritesPanel isOpen={showFavorites} onClose={() => setShowFavorites(false)} />
      <MusicControl />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={generatedImages}
            initialIndex={lightboxIndex}
            isOpen={lightboxIndex !== null}
            onClose={() => setLightboxIndex(null)}
            onDownload={handleDownload}
            onFavorite={handleAddToFavorites}
            isFavorite={isFavorite}
          />
        )}
      </AnimatePresence>

      {/* Image Filters */}
      <AnimatePresence>
        {editingImage && (
          <ImageFilters
            imageUrl={editingImage}
            isOpen={!!editingImage}
            onClose={() => setEditingImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Watermark Editor */}
      <AnimatePresence>
        {watermarkImage && (
          <WatermarkEditor
            imageUrl={watermarkImage}
            isOpen={!!watermarkImage}
            onClose={() => setWatermarkImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Image Upscaler */}
      <AnimatePresence>
        {upscaleImage && (
          <ImageUpscaler
            imageUrl={upscaleImage}
            isOpen={!!upscaleImage}
            onClose={() => setUpscaleImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Image Enhancer */}
      <AnimatePresence>
        {enhanceImage && (
          <ImageEnhancer
            imageUrl={enhanceImage}
            isOpen={!!enhanceImage}
            onClose={() => setEnhanceImage(null)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Premium Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-premium border-b border-border/20 sticky top-0 z-30 backdrop-blur-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-5 h-5 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-accent-foreground" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold gradient-text-animated">Selfie2Snap</h1>
                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-accent" />
                  Premium AI Portraits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{getProgress()}%</span>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFavorites(true)}
                  className="relative h-9 w-9 p-0"
                >
                  <Heart className={`w-4 h-4 ${favoritesCount > 0 ? "text-primary fill-primary" : ""}`} />
                  {favoritesCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-primary to-accent text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold"
                    >
                      {favoritesCount}
                    </motion.span>
                  )}
                </Button>
              </motion.div>

              <Link to="/history">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <History className="w-4 h-4" />
                </Button>
              </Link>

              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="h-9 w-9 p-0">
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="h-9 gap-1.5">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Sign In</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {/* Hero section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 mb-5"
            >
              <Star className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium">AI-Powered Portrait Generation</span>
              <Star className="w-3 h-3 text-accent" />
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Transform Your <span className="gradient-text-animated">Selfies</span>
              <br />
              <span className="text-2xl md:text-3xl text-muted-foreground">Into Masterpieces</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
              Upload two portraits and watch AI magic create stunning cinematic moments
            </p>

            {/* Workflow Steps - Minimal */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { step: 1, label: "Upload", done: !!portrait1 },
                { step: 2, label: "Style", done: !!portrait1 && !!portrait2 },
                { step: 3, label: "Generate", done: generatedImages.length > 0 },
                { step: 4, label: "Download", done: false },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      item.done
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-secondary/80 text-muted-foreground border border-border/50"
                    }`}
                  >
                    {item.done ? <Check className="w-3 h-3" /> : item.step}
                  </div>
                  <span className={`text-xs ${item.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {i < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground/40 hidden sm:block" />}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Ad banner */}
          <div className="mb-8">
            <AdBanner format="horizontal" className="rounded-2xl overflow-hidden" />
          </div>

          {/* Upload section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-4 mb-6"
          >
            {/* Portrait 1 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                First Portrait
              </label>
              <label className="group cursor-pointer block">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                    portrait1 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {portrait1 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait1}
                        alt="Portrait 1"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2 group-hover:text-primary/70 transition-colors" />
                      </motion.div>
                      <p className="text-xs text-muted-foreground/70">Drop or click to upload</p>
                    </div>
                  )}
                </motion.div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setPortrait1, true)}
                />
              </label>
            </div>

            {/* Portrait 2 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="w-3.5 h-3.5 text-accent" />
                Second Portrait
              </label>
              <label className="group cursor-pointer block">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                    portrait2 
                      ? "border-accent/50 bg-accent/5" 
                      : "border-border/50 hover:border-accent/40 hover:bg-accent/5"
                  }`}
                >
                  {portrait2 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait2}
                        alt="Portrait 2"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      >
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2 group-hover:text-accent/70 transition-colors" />
                      </motion.div>
                      <p className="text-xs text-muted-foreground/70">Drop or click to upload</p>
                    </div>
                  )}
                </motion.div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setPortrait2, false)}
                />
              </label>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-premium rounded-2xl p-5 mb-6 space-y-5 border border-border/20"
          >
            {/* Frame style */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Frame Style
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {FRAME_STYLES.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => {
                      playSound("click");
                      setFrameStyle(style.id);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                      frameStyle === style.id
                        ? `bg-gradient-to-r ${style.color} text-white shadow-md`
                        : "bg-secondary/50 hover:bg-secondary/80 border border-border/30"
                    }`}
                  >
                    <span className="text-sm">{style.emoji}</span>
                    <span className="hidden sm:block">{style.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Frame count */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Frames</label>
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">{frameCount}</span>
              </div>
              <Slider
                value={[frameCount]}
                onValueChange={(v) => setFrameCount(v[0])}
                min={1}
                max={4}
                step={1}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  variant="premium"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!portrait1 || !portrait2 || isGenerating}
                  className="w-full"
                >
                  <Wand2 className="mr-2 w-4 h-4" />
                  Generate Snaps
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  disabled={isGenerating}
                  className="px-4"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Generated images */}
          <AnimatePresence>
            {generatedImages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Snaps
                  </h3>
                  <BatchDownload images={generatedImages} />
                </div>

                {/* Comparison slider */}
                {selectedComparison !== null && portrait1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto mb-5"
                  >
                    <ComparisonSlider
                      beforeImage={portrait1}
                      afterImage={generatedImages[selectedComparison]}
                      beforeLabel="Original"
                      afterLabel="Generated"
                    />
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComparison(null)}
                        className="text-xs"
                      >
                        Close
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {generatedImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="group relative rounded-xl overflow-hidden bg-secondary/30 border border-border/30 shadow-lg"
                    >
                      <div className="aspect-square">
                        <img
                          src={image}
                          alt={`Generated snap ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Selfie2Snap watermark */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-background/60 backdrop-blur-sm">
                          <span className="text-[8px] font-medium text-foreground/70">Selfie2Snap</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2.5">
                        {/* Row 1 */}
                        <div className="grid grid-cols-4 gap-1 mb-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setLightboxIndex(index)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="View"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedComparison(index)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Compare"
                          >
                            <Eye className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingImage(image)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Filters"
                          >
                            <Sliders className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEnhanceImage(image)}
                            className="h-7 w-full rounded-md bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent flex items-center justify-center transition-colors text-primary-foreground"
                            title="AI Enhance"
                          >
                            <Sparkles className="w-3 h-3" />
                          </motion.button>
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-4 gap-1 mb-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setUpscaleImage(image)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Upscale"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setWatermarkImage(image)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Watermark"
                          >
                            <Type className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDownload(image)}
                            className="h-7 w-full rounded-md bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToFavorites(image)}
                            className={`h-7 w-full rounded-md flex items-center justify-center transition-colors ${
                              isFavorite(image) 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary/80 hover:bg-secondary"
                            }`}
                            title="Favorite"
                          >
                            <Heart className={`w-3 h-3 ${isFavorite(image) ? "fill-current" : ""}`} />
                          </motion.button>
                        </div>
                        <SocialShare imageUrl={image} title={`Check out my ${frameStyle} AI snap!`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom ad */}
          <div className="mt-10">
            <AdBanner format="rectangle" className="rounded-xl overflow-hidden max-w-sm mx-auto" />
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-premium border-t border-border/20 py-5 mt-auto">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              Created by <span className="font-semibold gradient-text">Nurash Weerasinghe</span>
            </motion.p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              © {new Date().getFullYear()} Selfie2Snap. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
