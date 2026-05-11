import { Eye, Heart, MessageSquare, Share2, Download, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProjectMetricsProps {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  downloads: number;
  engagementRate: number;
  trend?: "up" | "down" | "stable";
}

export function ProjectMetrics({
  views,
  likes,
  comments,
  shares,
  downloads,
  engagementRate,
  trend = "up",
}: ProjectMetricsProps) {
  const metrics = [
    {
      label: "Views",
      value: views.toLocaleString(),
      icon: Eye,
      color: "from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800",
      textColor: "text-blue-900 dark:text-blue-100",
    },
    {
      label: "Likes",
      value: likes.toLocaleString(),
      icon: Heart,
      color: "from-pink-50 to-pink-100 dark:from-pink-900 dark:to-pink-800",
      textColor: "text-pink-900 dark:text-pink-100",
    },
    {
      label: "Comments",
      value: comments.toLocaleString(),
      icon: MessageSquare,
      color: "from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800",
      textColor: "text-purple-900 dark:text-purple-100",
    },
    {
      label: "Shares",
      value: shares.toLocaleString(),
      icon: Share2,
      color: "from-green-50 to-green-100 dark:from-green-900 dark:to-green-800",
      textColor: "text-green-900 dark:text-green-100",
    },
    {
      label: "Downloads",
      value: downloads.toLocaleString(),
      icon: Download,
      color: "from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800",
      textColor: "text-orange-900 dark:text-orange-100",
    },
    {
      label: "Engagement",
      value: `${engagementRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800",
      textColor: "text-cyan-900 dark:text-cyan-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className={`bg-gradient-to-br ${metric.color} border-0 p-4`}>
            <div className="flex flex-col gap-2">
              <Icon className={`w-5 h-5 ${metric.textColor}`} />
              <div>
                <p className={`text-2xl font-bold ${metric.textColor}`}>
                  {metric.value}
                </p>
                <p className={`text-xs font-medium ${metric.textColor} opacity-70`}>
                  {metric.label}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
