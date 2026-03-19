import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, User, MapPin, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ["explore-artists", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (search.trim()) {
        query = query.or(
          `display_name.ilike.%${search}%,username.ilike.%${search}%,location.ilike.%${search}%`
        );
      }

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Explore<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Discover artists, producers, and creatives.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or location..."
            className="pl-10 h-11 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
          <Filter size={16} />
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : artists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              className="border-border/50 hover:border-primary/20 transition-all group cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-foreground truncate">
                      {artist.display_name || "Artist"}
                    </h3>
                    {artist.username && (
                      <p className="text-[11px] text-muted-foreground">@{artist.username}</p>
                    )}
                  </div>
                </div>

                {artist.location && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin size={10} /> {artist.location}
                  </p>
                )}

                {artist.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{artist.bio}</p>
                )}

                {artist.skills && artist.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(artist.skills as string[]).slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    {(artist.skills as string[]).length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        +{(artist.skills as string[]).length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Compass size={28} className="text-accent" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              {search ? "No artists found" : "Be the first!"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search
                ? "Try different keywords or clear the search."
                : "No other artists have joined yet. Share inlivin with your creative community!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
