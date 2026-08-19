import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, XCircle, FolderOpen, Mail } from "lucide-react";
import { motion } from "framer-motion";

export interface InvitationItem {
  id: string;
  role: string;
  project: { id: string; title: string; cover_url?: string | null; category?: string | null } | undefined;
}

interface InvitationsPanelProps {
  invitations: InvitationItem[];
  onAccept: (collabId: string) => void;
  onDecline: (collabId: string) => void;
}

export function InvitationsPanel({ invitations, onAccept, onDecline }: InvitationsPanelProps) {
  if (invitations.length === 0) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4"><Mail size={28} className="text-accent" /></div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">No pending invitations</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Project invitations sent to you will show up here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {invitations.map((inv, i) => (
        <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                {inv.project?.cover_url ? (
                  <img src={inv.project.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FolderOpen size={18} className="text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/projects/${inv.project?.id}`} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                  {inv.project?.title || "Untitled project"}
                </Link>
                <p className="text-[11px] text-muted-foreground">Invited as <span className="capitalize font-medium">{inv.role}</span></p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="hero" size="icon" className="h-8 w-8" onClick={() => onAccept(inv.id)}><Check size={14} /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onDecline(inv.id)}><XCircle size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
