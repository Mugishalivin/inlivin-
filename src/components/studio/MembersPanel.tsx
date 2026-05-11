import { useState } from "react";
import { User, Mail, UserPlus, MoreVertical, Shield, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StudioMember } from "@/types/studio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MembersPanelProps {
  members: StudioMember[];
  isOwner: boolean;
  currentUserId: string;
  onAddMember?: (email: string, role: string) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onUpdateRole?: (memberId: string, role: string) => Promise<void>;
}

const roleColors = {
  owner: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function MembersPanel({
  members,
  isOwner,
  currentUserId,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: MembersPanelProps) {
  const [openAddMember, setOpenAddMember] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await onAddMember?.(email, role);
      setEmail("");
      setRole("member");
      setOpenAddMember(false);
    } finally {
      setLoading(false);
    }
  };

  const activemembers = members.filter((m) => m.status === "active");
  const invitedMembers = members.filter((m) => m.status === "invited");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members</h3>
          <span className="ml-2 px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm font-medium">
            {activemembers.length}
          </span>
        </div>
        {isOwner && (
          <Button
            size="sm"
            onClick={() => setOpenAddMember(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Active Members */}
      <div className="space-y-3 mb-6">
        {activemembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {member.user?.user_metadata?.display_name?.charAt(0) || member.user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {member.user?.user_metadata?.display_name || member.user?.email}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {member.user?.email}
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${roleColors[member.role as keyof typeof roleColors]}`}>
                {member.role}
              </span>
            </div>
            {isOwner && member.user_id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdateRole?.(member.id, "editor")}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Make Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateRole?.(member.id, "member")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Make Member
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRemoveMember?.(member.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Invited Members */}
      {invitedMembers.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Pending Invitations</p>
          <div className="space-y-3 opacity-75">
            {invitedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">{member.user?.email}</span>
                </div>
                <span className="text-xs text-slate-500">Invited</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={openAddMember} onOpenChange={setOpenAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborator@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="viewer">Viewer (View Only)</option>
                <option value="member">Member (Standard)</option>
                <option value="editor">Editor (Can Edit)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpenAddMember(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={loading || !email}>
                {loading ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
