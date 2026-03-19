import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Plus, Music, Image, Video } from "lucide-react";

const projectTypes = [
  { label: "Music", icon: Music, desc: "Tracks, albums, beats" },
  { label: "Visual Art", icon: Image, desc: "Photography, design, illustration" },
  { label: "Video", icon: Video, desc: "Films, clips, reels" },
];

export default function ProjectsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Projects<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and showcase your creative work.</p>
        </div>
        <Button variant="hero" size="sm">
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Empty state */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first project to start building your portfolio and attract collaborators.
          </p>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
            {projectTypes.map((type) => (
              <button
                key={type.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <type.icon size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-foreground">{type.label}</span>
                <span className="text-[10px] text-muted-foreground">{type.desc}</span>
              </button>
            ))}
          </div>

          <Button variant="hero">
            <Plus size={16} /> Create First Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
