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
          // Update state progressively so user sees images appearing
          setGeneratedImages([...newImages]);
        } else if (data?.error) {
          console.error('API error:', data.error);
          toast.error(data.error);
        }
      }

      if (newImages.length > 0) {
        playSound("complete");
        toast.success(`Generated ${newImages.length} amazing snaps!`);
        
        // Auto-save to generated_images if user is logged in
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass border-b border-border/50 sticky top-0 z-30"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center animate-glow-pulse"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Selfie2Snap</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" />
                  AI Portrait Magic
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 mr-4 glass px-3 py-2 rounded-full">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs font-medium text-primary">{getProgress()}%</span>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFavorites(true)}
                  className="relative"
                >
                  <Heart className={`w-4 h-4 ${favoritesCount > 0 ? "text-primary fill-primary" : ""}`} />
                  {favoritesCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold"
                    >
                      {favoritesCount}
                    </motion.span>
                  )}
                </Button>
              </motion.div>

              <Link to="/history">
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </Link>

              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
          {/* Hero section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Star className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium">AI-Powered Portrait Generation</span>
              <Star className="w-4 h-4 text-accent animate-pulse" />
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transform Your <span className="gradient-text">Selfies</span>
              <br />
              <span className="text-3xl md:text-4xl text-muted-foreground">Into Art</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload two portraits and watch AI magic create stunning cinematic moments
            </p>

            {/* Workflow Steps */}
            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap mb-8">
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      item.done
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.done ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className={`text-sm ${item.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground/50 hidden md:block" />}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Ad banner */}
          <div className="mb-10">
            <AdBanner format="horizontal" className="rounded-xl overflow-hidden" />
          </div>

          {/* Upload section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Portrait 1 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                First Portrait
              </label>
              <label className="group cursor-pointer block">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                    portrait1 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {portrait1 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait1}
                        alt="Portrait 1"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-sm font-medium glass px-3 py-1 rounded-full">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                      </motion.div>
                      <p className="text-sm text-muted-foreground">Drop or click to upload</p>
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
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-accent" />
                Second Portrait
              </label>
              <label className="group cursor-pointer block">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                    portrait2 
                      ? "border-accent bg-accent/5" 
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  {portrait2 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait2}
                        alt="Portrait 2"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-sm font-medium glass px-3 py-1 rounded-full">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      >
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
                      </motion.div>
                      <p className="text-sm text-muted-foreground">Drop or click to upload</p>
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
            className="glass rounded-3xl p-6 mb-8 space-y-6"
          >
            {/* Frame style */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Frame Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FRAME_STYLES.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => {
                      playSound("click");
                      setFrameStyle(style.id);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      frameStyle === style.id
                        ? `bg-gradient-to-r ${style.color} text-white shadow-lg`
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <span>{style.emoji}</span>
                    <span>{style.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Frame count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Number of Frames</label>
                <span className="text-sm text-primary font-bold glass px-3 py-1 rounded-full">{frameCount}</span>
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
            <div className="flex flex-wrap gap-3">
              <motion.div className="flex-1 min-w-[200px]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="premium"
                  size="xl"
                  onClick={handleGenerate}
                  disabled={!portrait1 || !portrait2 || isGenerating}
                  className="w-full"
                >
                  <Wand2 className="mr-2" />
                  Generate Snaps
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={handleReset}
                  disabled={isGenerating}
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
                className="space-y-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Generated Snaps
                  </h3>
                  <BatchDownload images={generatedImages} />
                </div>

                {/* Comparison slider */}
                {selectedComparison !== null && portrait1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg mx-auto mb-6"
                  >
                    <ComparisonSlider
                      beforeImage={portrait1}
                      afterImage={generatedImages[selectedComparison]}
                      beforeLabel="Original"
                      afterLabel="Generated"
                    />
                    <div className="flex justify-center mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComparison(null)}
                      >
                        Close Comparison
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {generatedImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative rounded-2xl overflow-hidden glass"
                    >
                      <div className="aspect-square">
                        <img
                          src={image}
                          alt={`Generated snap ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                        {/* Quick actions row 1 */}
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setLightboxIndex(index)}
                              className="h-9 w-full p-0 glass-hover"
                              title="View in Gallery"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedComparison(index)}
                              className="h-9 w-full p-0 glass-hover"
                              title="Compare"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingImage(image)}
                              className="h-9 w-full p-0 glass-hover"
                              title="Edit Filters"
                            >
                              <Sliders className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setUpscaleImage(image)}
                              className="h-9 w-full p-0 glass-hover"
                              title="Upscale Image"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                        {/* Quick actions row 2 */}
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setWatermarkImage(image)}
                              className="h-9 w-full p-0 glass-hover"
                              title="Add Watermark"
                            >
                              <Type className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownload(image)}
                              className="h-9 w-full p-0 glass-hover"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="col-span-2">
                            <Button
                              size="sm"
                              variant={isFavorite(image) ? "default" : "secondary"}
                              onClick={() => handleAddToFavorites(image)}
                              className="h-9 w-full p-0 gap-1.5"
                              title="Add to Favorites"
                            >
                              <Heart className={`w-4 h-4 ${isFavorite(image) ? "fill-current" : ""}`} />
                              <span className="text-xs">{isFavorite(image) ? "Saved" : "Save"}</span>
                            </Button>
                          </motion.div>
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
          <div className="mt-12">
            <AdBanner format="rectangle" className="rounded-xl overflow-hidden max-w-md mx-auto" />
          </div>
        </main>

        {/* Footer */}
        <footer className="glass border-t border-border/50 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              Created by <span className="font-semibold gradient-text">Nurash Weerasinghe</span>
            </motion.p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              © {new Date().getFullYear()} Selfie2Snap. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
