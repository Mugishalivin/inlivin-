import { BarChart, LineChart, PieChart, TrendingUp, Eye, ThumbsUp, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StudioAnalytics } from "@/types/studio";

interface StudioAnalyticsComponentProps {
  analytics: StudioAnalytics[];
}

export function StudioAnalyticsComponent({ analytics }: StudioAnalyticsComponentProps) {
  if (analytics.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Analytics</h3>
        </div>
        <div className="text-center py-12">
          <BarChart className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400">No analytics data yet</p>
        </div>
      </div>
    );
  }

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.total_likes, 0);
  const totalDownloads = analytics.reduce((sum, a) => sum + a.total_downloads, 0);
  const totalVisitors = analytics.reduce((sum, a) => sum + a.visitors, 0);
  const avgEngagement =
    analytics.reduce((sum, a) => sum + a.engagement_rate, 0) / analytics.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Analytics</h3>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-200 font-medium uppercase tracking-wide">
                Views
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {totalViews.toLocaleString()}
              </p>
            </div>
            <Eye className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-200 font-medium uppercase tracking-wide">
                Visitors
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {totalVisitors.toLocaleString()}
              </p>
            </div>
            <PieChart className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900 dark:to-pink-800 border-pink-200 dark:border-pink-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-pink-600 dark:text-pink-200 font-medium uppercase tracking-wide">
                Likes
              </p>
              <p className="text-2xl font-bold text-pink-900 dark:text-pink-100 mt-1">
                {totalLikes.toLocaleString()}
              </p>
            </div>
            <ThumbsUp className="w-8 h-8 text-pink-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-200 font-medium uppercase tracking-wide">
                Downloads
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {totalDownloads.toLocaleString()}
              </p>
            </div>
            <Download className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-200 font-medium uppercase tracking-wide">
                Engagement
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {avgEngagement.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Daily Chart (Simple Timeline) */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Last 30 Days Activity
        </h4>
        <div className="space-y-3">
          {analytics.slice(0, 10).map((day) => (
            <div key={day.id} className="flex items-center gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 min-w-24">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-end pr-2">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${(day.views / Math.max(...analytics.map((a) => a.views))) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{day.views} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
