import { Activity, Upload, UserPlus, FolderPlus, CheckCircle, MessageSquare } from "lucide-react";
import { StudioActivity } from "@/types/studio";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: StudioActivity[];
}

const actionIcons: Record<string, React.ReactNode> = {
  created_project: <FolderPlus className="w-4 h-4 text-blue-600" />,
  uploaded_asset: <Upload className="w-4 h-4 text-green-600" />,
  added_member: <UserPlus className="w-4 h-4 text-purple-600" />,
  completed_task: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  commented: <MessageSquare className="w-4 h-4 text-orange-600" />,
};

const actionText: Record<string, string> = {
  created_project: "created a project",
  uploaded_asset: "uploaded an asset",
  added_member: "added a team member",
  completed_task: "completed a task",
  commented: "left a comment",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Feed</h3>
        </div>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400">No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Feed</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const isLast = index === activities.length - 1;
          const displayName =
            activity.user?.user_metadata?.display_name ||
            activity.user?.email ||
            "Unknown User";

          return (
            <div key={activity.id} className={`flex gap-4 pb-4 ${!isLast ? "border-b border-slate-200 dark:border-slate-800" : ""}`}>
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                {!isLast && (
                  <div className="absolute top-10 left-5 w-0.5 h-12 bg-slate-200 dark:bg-slate-700" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-medium">{displayName}</span>
                      {" "}
                      <span className="text-slate-600 dark:text-slate-400">
                        {actionText[activity.action] || activity.action}
                      </span>
                      {activity.content?.name && (
                        <span className="font-medium text-slate-900 dark:text-white">
                          {" "}"
                          {activity.content.name}
                          "
                        </span>
                      )}
                    </p>
                    {activity.content?.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">
                        {activity.content.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {actionIcons[activity.action] || (
                      <Activity className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
