import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  image_id: string;
  image_url: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFavorites();
      } else {
        setFavorites([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFavorites();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          image_id,
          created_at,
          generated_images (
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedFavorites: Favorite[] = (data || []).map((fav: any) => ({
        id: fav.id,
        image_id: fav.image_id,
        image_url: fav.generated_images?.image_url || "",
        created_at: fav.created_at,
      }));

      setFavorites(formattedFavorites);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = useCallback(async (imageUrl: string, prompt?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return false;
    }

    try {
      // First, save the image to generated_images
      const { data: imageData, error: imageError } = await supabase
        .from("generated_images")
        .insert({
          image_url: imageUrl,
          user_id: user.id,
          prompt: prompt || null,
        })
        .select()
        .single();

      if (imageError) throw imageError;

      // Then add to favorites
      const { error: favError } = await supabase
        .from("favorites")
        .insert({
          image_id: imageData.id,
          user_id: user.id,
        });

      if (favError) throw favError;

      // Refresh favorites
      fetchFavorites();
      toast.success("Added to favorites!");
      return true;
    } catch (error: any) {
      toast.error("Failed to add to favorites");
      return false;
    }
  }, [user]);

  const removeFromFavorites = useCallback(async (favoriteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success("Removed from favorites");
      return true;
    } catch (error: any) {
      toast.error("Failed to remove from favorites");
      return false;
    }
  }, []);

  const isFavorite = useCallback((imageUrl: string): boolean => {
    return favorites.some((f) => f.image_url === imageUrl);
  }, [favorites]);

  return {
    favorites,
    loading,
    user,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refreshFavorites: fetchFavorites,
    favoritesCount: favorites.length,
  };
};
