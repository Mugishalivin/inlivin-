import { History, FileText, Image as ImageIcon, Video as VideoIcon, Archive } from "lucide-react";
import { StudioAsset } from "@/types/studio";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface AssetTimelineProps {
  assets: StudioAsset[];
  onSelectAsset?: (asset: StudioAsset) => void;
}

const getAssetIcon = (fileType?: string) => {
  if (!fileType) return FileText;
  if (fileType.startsWith("image")) return ImageIcon;
  if (fileType.startsWith("video")) return VideoIcon;
  return FileText;
};

const getAssetColor = (fileType?: string) => {
  if (!fileType) return "bg-slate-100 dark:bg-slate-800";
  if (fileType.startsWith("image")) return "bg-blue-100 dark:bg-blue-900";
  if (fileType.startsWith("video")) return "bg-purple-100 dark:bg-purple-900";
  return "bg-slate-100 dark:bg-slate-800";
};

export function AssetTimeline({ assets, onSelectAsset }: AssetTimelineProps) {
  if (!assets.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Asset Timeline
          </h3>
        </div>
        <div className="text-center py-8">
          <Archive className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400">No assets yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Asset Timeline ({assets.length})
        </h3>
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-purple-500" />

        {/* Timeline items */}
        <div className="space-y-4">
          {assets.map((asset, index) => {
            const Icon = getAssetIcon(asset.file_type);
            return (
              <div
                key={asset.id}
                className="relative pl-20 cursor-pointer group"
                onClick={() => onSelectAsset?.(asset)}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-4 border-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>

                {/* Content */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 group-hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                        {asset.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(asset.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {asset.version > 1 && (
                        <Badge variant="outline">v{asset.version}</Badge>
                      )}
                      {asset.is_public && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>

                  {asset.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                      {asset.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>{asset.file_type || "File"}</span>
                    <span>•</span>
                    <span>
                      {asset.file_size
                        ? `${(asset.file_size / 1024 / 1024).toFixed(2)}MB`
                        : "Unknown size"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
