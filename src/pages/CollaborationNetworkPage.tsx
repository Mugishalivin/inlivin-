import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Users, UserPlus, MessageCircle, Zap, TrendingUp, Search, CheckCircle, Clock, X, Eye, Share2, Settings } from "lucide-react";
import { toast } from "sonner";
import { CreatorBadgesRow } from "@/components/CreatorBadges";

interface Team {
  id: string;
  name: string;
  members: string[];
  created_at: string;
}

interface CollaborationRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string;
  created_at: string;
}

export default function CollaborationNetworkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"discover" | "requests" | "collaborators" | "teams">("discover");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestingUserId, setRequestingUserId] = useState("");

  // Discover creators & search everything
  const { data: allCreators = [] } = useQuery({
    queryKey: ["collab", "discover", searchTerm],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data } = await query.limit(50);
      return data?.filter(p => p.user_id !== user?.id) ?? [];
    },
  });

  // Collaborators (accepted requests)
  const { data: collaborators = [] } = useQuery({
    queryKey: ["collab", "collaborators", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: requests } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      if (!requests?.length) return [];
      
      const userIds = requests.map(r => r.requester_id === user.id ? r.recipient_id : r.requester_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      
      return profiles ?? [];
    },
    enabled: !!user,
  });

  // Pending requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["collab", "pending", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // User's requests
  const { data: userRequests = [] } = useQuery({
    queryKey: ["collab", "user-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });
      
      return data ?? [];
    },
    enabled: !!user,
  });

  // Teams
  const { data: teams = [] } = useQuery({
    queryKey: ["collab", "teams", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("teams")
        .select("*")
        .contains("member_ids", [user.id])
        .order("created_at", { ascending: false });
      
      return data ?? [];
    },
    enabled: !!user,
  });

  // Creator analytics for ranking
  const { data: creatorStats = {} } = useQuery({
    queryKey: ["collab", "stats"],
    queryFn: async () => {
      const { data } = await supabase.from("creator_analytics").select("user_id, trending_rank, total_followers");
      const map: Record<string, any> = {};
      data?.forEach(d => {
        map[d.user_id] = { rank: d.trending_rank, followers: d.total_followers };
      });
      return map;
    },
  });

  // Send collaboration request
  const sendRequestMutation = useMutation({
    mutationFn: async ({ recipient_id, message }: { recipient_id: string; message: string }) => {
      const { error } = await supabase.from("collaboration_requests").insert({
        requester_id: user!.id,
        recipient_id,
        message,
        status: "pending",
      });
      
      if (error) throw error;
      
      // Send notification
      await supabase.from("notifications").insert({
        user_id: recipient_id,
        title: "Collaboration Request",
        message: `${user?.user_metadata?.display_name || "Someone"} wants to collaborate with you!`,
        type: "collaboration",
        reference_id: user!.id,
        reference_type: "user",
      });
    },
    onSuccess: () => {
      toast.success("Collaboration request sent!");
      queryClient.invalidateQueries({ queryKey: ["collab"] });
      setRequestMessage("");
      setRequestingUserId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Accept/Reject request
  const respondRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase
        .from("collaboration_requests")
        .update({ status })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(`Request ${status}!`);
      queryClient.invalidateQueries({ queryKey: ["collab"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create team
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").insert({
        name: teamName,
        creator_id: user!.id,
        member_ids: [user!.id, ...selectedMembers],
        created_at: new Date().toISOString(),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created!");
      queryClient.invalidateQueries({ queryKey: ["collab", "teams"] });
      setTeamName("");
      setSelectedMembers([]);
      setTeamOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getRequestStatus = (creatorId: string) => {
    const request = userRequests.find(r => r.recipient_id === creatorId);
    if (request?.status === "pending") return "pending";
    if (request?.status === "accepted") return "accepted";
    return null;
  };

  const renderDiscoverTab = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search creators, projects, all..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCreators.map((creator, idx) => {
          const stats = creatorStats[creator.user_id];
          const status = getRequestStatus(creator.user_id);
          
          return (
            <motion.div key={creator.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:border-primary/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex gap-3 mb-3">
                    {creator.avatar_url && (
                      <img src={creator.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{creator.display_name || "Creator"}</h3>
                      <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      {stats && (
                        <p className="text-xs text-amber-500 mt-1">#{stats.rank} • {stats.followers?.toLocaleString()} followers</p>
                      )}
                    </div>
                  </div>

                  {creator.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{creator.bio}</p>}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={status === "accepted" ? "secondary" : "outline"}
                      className="flex-1 h-8"
                      onClick={() => {
                        if (status === "accepted") {
                          navigate(`/messages?chatWith=${creator.user_id}`);
                        } else {
                          setRequestingUserId(creator.user_id);
                        }
                      }}
                    >
                      {status === "accepted" ? (
                        <>
                          <MessageCircle className="w-3 h-3 mr-1" /> Message
                        </>
                      ) : status === "pending" ? (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" /> Request
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => navigate(`/profile/${creator.user_id}`)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderRequestsTab = () => (
    <div className="space-y-4">
      {pendingRequests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No pending requests</p>
      ) : (
        pendingRequests.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">Collaboration Request</h3>
                  <p className="text-sm text-muted-foreground mt-1">{req.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    from <span className="font-medium">User: {req.requester_id.slice(0, 8)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "accepted" })}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondRequestMutation.mutate({ requestId: req.id, status: "rejected" })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderCollaboratorsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collaborators.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground py-8">No active collaborators yet</p>
      ) : (
        collaborators.map((collab) => (
          <Card key={collab.user_id} className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  {collab.avatar_url && (
                    <img src={collab.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{collab.display_name}</h3>
                    <p className="text-xs text-muted-foreground">@{collab.username}</p>
                  </div>
                </div>
                <Badge className="bg-primary/70">Collaborating</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8"
                  onClick={() => navigate(`/messages?chatWith=${collab.user_id}`)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" /> Message
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => navigate(`/profile/${collab.user_id}`)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderTeamsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Users className="w-4 h-4" /> Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create a Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Team Name</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Summer Album Squad"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="mb-3 block">Select Members</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {collaborators.map((collab) => (
                    <div key={collab.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={collab.user_id}
                        checked={selectedMembers.includes(collab.user_id)}
                        onCheckedChange={(checked) => {
                          setSelectedMembers(
                            checked
                              ? [...selectedMembers, collab.user_id]
                              : selectedMembers.filter(id => id !== collab.user_id)
                          );
                        }}
                      />
                      <label
                        htmlFor={collab.user_id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {collab.display_name} (@{collab.username})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => createTeamMutation.mutate()}
                  disabled={!teamName || selectedMembers.length === 0}
                  className="w-full"
                >
                  Create Team
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No teams yet. Create one to organize collaboration!</p>
      ) : (
        teams.map((team: any, idx) => (
          <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" /> {team.name}
                    </CardTitle>
                    <CardDescription>{team.member_ids?.length || 0} members</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.member_ids?.map((memberId: string) => (
                    <Badge key={memberId} variant="secondary">
                      {memberId.slice(0, 8)}...
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Collaboration Network
          </h1>
          <p className="text-muted-foreground mt-2">Discover creators, request collaborations, manage teams.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(["discover", "requests", "collaborators", "teams"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                tab === t
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "requests" && pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500">
                  {pendingRequests.length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      {tab === "discover" && renderDiscoverTab()}
      {tab === "requests" && renderRequestsTab()}
      {tab === "collaborators" && renderCollaboratorsTab()}
      {tab === "teams" && renderTeamsTab()}

      {/* Collaboration Request Dialog */}
      {requestingUserId && (
        <Dialog open={!!requestingUserId} onOpenChange={(open) => !open && setRequestingUserId("")}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Collaboration Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell them why you want to collaborate..."
                  rows={4}
                  className="mt-1.5"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => sendRequestMutation.mutate({ recipient_id: requestingUserId, message: requestMessage })}
                  className="w-full"
                  disabled={!requestMessage.trim()}
                >
                  Send Request
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
