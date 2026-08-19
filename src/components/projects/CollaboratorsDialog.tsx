import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, UserPlus, Users, X } from "lucide-react";
import { UserBadge } from "@/components/UserBadge";
import type { LucideIcon } from "lucide-react";

interface RoleOption { value: string; label: string; icon: LucideIcon }
interface Profile { id?: string; user_id: string; display_name?: string | null; avatar_url?: string | null; username?: string | null }
interface Collaborator { id: string; user_id: string; role: string; status: string; profile?: Profile | null }

interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collabRoles: RoleOption[];
  inviteSearch: string; setInviteSearch: (v: string) => void;
  inviteRole: string; setInviteRole: (v: string) => void;
  inviteResults: Profile[];
  collaborators: Collaborator[];
  onInvite: (userId: string) => void;
  onRemove: (collabId: string) => void;
}

export function CollaboratorsDialog(props: CollaboratorsDialogProps) {
  const { open, onOpenChange, collabRoles, inviteSearch, setInviteSearch, inviteRole, setInviteRole,
    inviteResults, collaborators, onInvite, onRemove } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Users size={18} /> Collaborators</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium">Invite Artist</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search artists..." className="pl-9 h-9" value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} />
              </div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="sm:w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{collabRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {inviteResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {inviteResults.map(p => (
                  <button key={p.user_id} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 text-left text-sm" onClick={() => onInvite(p.user_id)}>
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                    </div>
                    <span className="truncate flex-1 flex items-center gap-1 min-w-0">
                      <span className="truncate">{p.display_name || "Artist"}</span>
                      <UserBadge userId={p.user_id} size={13} />
                    </span>
                    <UserPlus size={14} className="ml-auto text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium">Current Collaborators</Label>
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No collaborators yet</p>
              ) : (
                collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">{c.profile?.display_name || "Artist"} <UserBadge userId={c.user_id} size={13} /></p>
                      <p className="text-[10px] text-muted-foreground capitalize">{c.role} · {c.status}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(c.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
