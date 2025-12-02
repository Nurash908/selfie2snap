import { Heart, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { toast } from "sonner";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritesPanel = ({ isOpen, onClose }: FavoritesPanelProps) => {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { playSound } = useSoundEffects();

  const handleDownload = (imageUrl: string) => {
    playSound("download");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `selfie2snap-favorite-${Date.now()}.png`;
    link.click();
    toast.success("Download started!");
  };

  const handleRemove = async (id: string) => {
    const success = await removeFromFavorites(id);
    if (success) {
      playSound("click");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl animate-slide-in-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h2 className="text-xl font-bold">Favorites</h2>
            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium">
              {favorites.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No favorites yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click the heart icon on generated images to save them
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((favorite, index) => (
                <div
                  key={favorite.id}
                  className="relative group rounded-xl overflow-hidden bg-secondary/50 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="aspect-square">
                    <img
                      src={favorite.image_url}
                      alt="Favorite"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(favorite.image_url)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(favorite.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPanel;
