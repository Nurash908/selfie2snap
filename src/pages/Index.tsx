import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import InteractiveBackground from "@/components/InteractiveBackground";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import FavoritesPanel from "@/components/FavoritesPanel";
import MusicControl from "@/components/MusicControl";
import AdBanner from "@/components/AdBanner";
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
} from "lucide-react";

const FRAME_STYLES = [
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "cinematic", label: "Cinematic", emoji: "🎬" },
  { id: "anime", label: "Anime", emoji: "🎨" },
  { id: "vintage", label: "Vintage", emoji: "📷" },
  { id: "fantasy", label: "Fantasy", emoji: "✨" },
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
  const navigate = useNavigate();

  const { playSound } = useSoundEffects();
  const { addToFavorites, isFavorite, favoritesCount } = useFavorites();

  // Calculate progress percentage
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

    try {
      const newImages: string[] = [];

      for (let i = 0; i < frameCount; i++) {
        setCurrentGeneratingFrame(i);

        const prompt = `Create a ${frameStyle} style portrait photo combining these two people in a charming, cinematic moment. Frame ${i + 1} of ${frameCount}. Style: ${FRAME_STYLES.find(s => s.id === frameStyle)?.label}. Make it look natural and beautiful.`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: portrait1 } },
                  { type: "image_url", image_url: { url: portrait2 } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          newImages.push(imageUrl);
        }
      }

      setGeneratedImages(newImages);
      playSound("complete");
      toast.success(`Generated ${newImages.length} amazing snaps!`);
    } catch (error: any) {
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
    await addToFavorites(imageUrl, `${frameStyle} style selfie`);
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
    toast.success("Workspace reset!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <InteractiveBackground />
      
      {isGenerating && (
        <GeneratingAnimation frameCount={frameCount} currentFrame={currentGeneratingFrame} />
      )}

      <FavoritesPanel isOpen={showFavorites} onClose={() => setShowFavorites(false)} />
      <MusicControl />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="glass border-b border-border/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center animate-glow-pulse">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Selfie2Snap</h1>
                <p className="text-xs text-muted-foreground">AI Portrait Generator</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-2 mr-4">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{getProgress()}%</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFavorites(true)}
                className="relative"
              >
                <Heart className={`w-4 h-4 ${favoritesCount > 0 ? "text-primary fill-primary" : ""}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Button>

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
                  <Button variant="ghost" size="sm">
                    <LogIn className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero section */}
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Transform Your <span className="gradient-text">Selfies</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload two portraits and watch AI magic create stunning cinematic moments
            </p>
          </div>

          {/* Ad banner */}
          <div className="mb-8">
            <AdBanner format="horizontal" className="rounded-xl overflow-hidden" />
          </div>

          {/* Upload section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Portrait 1 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                First Portrait
              </label>
              <label className="group cursor-pointer">
                <div className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                  portrait1 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}>
                  {portrait1 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait1}
                        alt="Portrait 1"
                        className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                      <p className="text-sm text-muted-foreground">Drop or click to upload</p>
                    </div>
                  )}
                </div>
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
              <label className="group cursor-pointer">
                <div className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                  portrait2 
                    ? "border-accent bg-accent/5" 
                    : "border-border hover:border-accent/50 hover:bg-accent/5"
                }`}>
                  {portrait2 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={portrait2}
                        alt="Portrait 2"
                        className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
                      <p className="text-sm text-muted-foreground">Drop or click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setPortrait2, false)}
                />
              </label>
            </div>
          </div>

          {/* Controls */}
          <div className="glass rounded-2xl p-6 mb-8 space-y-6 animate-fade-in">
            {/* Frame style */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Frame Style</label>
              <div className="flex flex-wrap gap-2">
                {FRAME_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      playSound("click");
                      setFrameStyle(style.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      frameStyle === style.id
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground scale-105"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {style.emoji} {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame count - max 4 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Number of Frames</label>
                <span className="text-sm text-primary font-bold">{frameCount}</span>
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
              <Button
                variant="premium"
                size="xl"
                onClick={handleGenerate}
                disabled={!portrait1 || !portrait2 || isGenerating}
                className="flex-1 min-w-[200px]"
              >
                <Wand2 className="mr-2" />
                Generate Snaps
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={handleReset}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Generated images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Generated Snaps
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl overflow-hidden glass animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="aspect-square">
                      <img
                        src={image}
                        alt={`Generated snap ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(image)}
                        className="h-9 w-9 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isFavorite(image) ? "default" : "secondary"}
                        onClick={() => handleAddToFavorites(image)}
                        className="h-9 w-9 p-0"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(image) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom ad */}
          <div className="mt-12">
            <AdBanner format="rectangle" className="rounded-xl overflow-hidden max-w-md mx-auto" />
          </div>
        </main>

        {/* Footer */}
        <footer className="glass border-t border-border/50 mt-auto py-6">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Created with ❤️ by Nurash Weerasinghe</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
