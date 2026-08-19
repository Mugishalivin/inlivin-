import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";
import { Edit, Trash2, UserPlus, MoreVertical, Globe, Lock, Heart, MessageCircle, Eye } from "lucide-react";
import { UserBadge } from "@/components/UserBadge";

export interface ProjectCardData {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  is_public?: boolean | null;
  cover_url?: string | null;
  tags?: string[] | null;
  user_id?: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
  view: "grid" | "list";
  getCategoryIcon: (cat: string) => LucideIcon;
  likeCount: number;
  commentCount: number;
  isCollab?: boolean;
  collabRole?: string;
  ownerLabel?: string;
  onEdit?: (project: ProjectCardData) => void;
  onManageCollaborators?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({
  project, view, getCategoryIcon, likeCount, commentCount, isCollab, collabRole,
  ownerLabel, onEdit, onManageCollaborators, onDelete,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const CatIcon = getCategoryIcon(project.category || "other");
  const isList = view === "list";
  const canManage = !isCollab && (onEdit || onManageCollaborators || onDelete);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <Card
        className="border-border/60 bg-card/60 backdrop-blur hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden group cursor-pointer h-full"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <CardContent className={`p-0 ${isList ? "flex items-stretch" : ""}`}>
          <div className={`relative overflow-hidden bg-secondary ${isList ? "w-24 sm:w-32 shrink-0" : "h-40"}`}>
            {project.cover_url ? (
              <img src={project.cover_url} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/40">
                <CatIcon size={isList ? 20 : 36} className="text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/80 backdrop-blur text-foreground flex items-center gap-1">
                {project.is_public ? <Globe size={10} /> : <Lock size={10} />}
              </span>
              {isCollab && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/80 backdrop-blur text-accent-foreground capitalize">{collabRole}</span>
              )}
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  {onEdit && <DropdownMenuItem onClick={() => onEdit(project)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>}
                  {onManageCollaborators && <DropdownMenuItem onClick={() => onManageCollaborators(project.id)}><UserPlus size={14} className="mr-2" /> Collaborators</DropdownMenuItem>}
                  {onDelete && <DropdownMenuItem className="text-destructive" onClick={() => onDelete(project.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="p-3.5 sm:p-4 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-display font-bold text-sm text-foreground truncate">{project.title}</h3>
              {project.user_id && <UserBadge userId={project.user_id} size={13} />}
            </div>
            {ownerLabel && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{ownerLabel}</p>}
            {project.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">{project.description}</p>}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Heart size={12} /> {likeCount}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {commentCount}</span>
              <span className="flex items-center gap-1 capitalize"><Eye size={12} /> {project.category}</span>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(project.tags as string[]).slice(0, 3).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
