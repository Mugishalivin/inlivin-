import { Users, Clock, Heart, Eye } from "lucide-react";
import { StudioMember } from "@/types/studio";
import { Badge } from "@/components/ui/badge";

interface CollaborationStatusProps {
  members: StudioMember[];
  isLive: boolean;
  recentActivity: Array<{
    userId: string;
    action: string;
    timestamp: Date;
  }>;
}

export function CollaborationStatus({
  members,
  isLive,
  recentActivity,
}: CollaborationStatusProps) {
  const activeMembersCount = members.filter((m) => m.status === "active").length;
  const liveMembers = members.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Live Collaboration
          </h3>
          {isLive && (
            <Badge className="bg-green-500 text-white animate-pulse gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Active members display */}
      <div className="mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          {activeMembersCount} member{activeMembersCount !== 1 ? "s" : ""} working
        </p>
        <div className="flex items-center gap-2">
          {liveMembers.map((member, index) => (
            <div
              key={member.id}
              className="relative"
              style={{ marginLeft: index > 0 ? "-12px" : "0" }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-slate-900">
                {member.user?.user_metadata?.display_name?.charAt(0) || "U"}
              </div>
              {isLive && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-slate-900"></div>
              )}
            </div>
          ))}
          {activeMembersCount > 3 && (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              +{activeMembersCount - 3}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Recent activity
          </p>
          <div className="space-y-2">
            {recentActivity.slice(0, 4).map((activity, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{activity.action}</span>
                <span className="text-slate-500">
                  {Math.floor(
                    (new Date().getTime() - activity.timestamp.getTime()) / 60000
                  )}
                  m ago
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
