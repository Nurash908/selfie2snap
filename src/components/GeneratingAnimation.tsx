import { Sparkles, Camera, Wand2, Heart, Star } from "lucide-react";

interface GeneratingAnimationProps {
  frameCount: number;
  currentFrame: number;
}

const funMessages = [
  "Mixing the pixels...",
  "Adding sparkle magic...",
  "Brewing creativity...",
  "Painting dreams...",
  "Crafting perfection...",
];

const GeneratingAnimation = ({ frameCount, currentFrame }: GeneratingAnimationProps) => {
  const progress = Math.min((currentFrame / frameCount) * 100, 100);
  const messageIndex = Math.min(Math.floor((currentFrame / frameCount) * funMessages.length), funMessages.length - 1);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        {/* Main animation container */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-ring" />
          <div className="absolute inset-4 rounded-full border-4 border-accent/30 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          <div className="absolute inset-8 rounded-full border-4 border-primary/30 animate-pulse-ring" style={{ animationDelay: "1s" }} />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center animate-bounce-soft">
              <Sparkles className="w-12 h-12 text-primary-foreground animate-wiggle" />
            </div>
          </div>

          {/* Orbiting icons */}
          <div className="absolute inset-0 animate-spin-slow">
            <Camera className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-primary" />
            <Wand2 className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-accent" />
            <Heart className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 text-primary" />
            <Star className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 text-accent" />
          </div>
        </div>

        {/* Progress info */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold gradient-text">Creating Your Snaps</h2>
          <p className="text-muted-foreground animate-pulse">{funMessages[messageIndex]}</p>

          {/* Progress bar */}
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 animate-shimmer" />
          </div>

          {/* Frame indicators */}
          <div className="flex justify-center gap-2">
            {[...Array(frameCount)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < currentFrame
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground scale-110"
                    : i === currentFrame
                    ? "bg-primary/30 text-foreground animate-pulse"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Frame {Math.min(currentFrame + 1, frameCount)} of {frameCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingAnimation;
