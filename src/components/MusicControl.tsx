import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useState } from "react";

const MusicControl = () => {
  const { isPlaying, toggleMusic, volume, updateVolume } = useBackgroundMusic();
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {showSlider && (
        <div className="glass rounded-full px-4 py-2 flex items-center gap-3 animate-fade-in">
          <Slider
            value={[volume * 100]}
            onValueChange={(v) => updateVolume(v[0] / 100)}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      )}
      <Button
        size="icon"
        variant="secondary"
        onClick={toggleMusic}
        className="rounded-full w-12 h-12 glass hover:scale-110 transition-transform"
      >
        {isPlaying ? (
          <Music className="w-5 h-5 text-primary animate-bounce-soft" />
        ) : (
          <VolumeX className="w-5 h-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export default MusicControl;
