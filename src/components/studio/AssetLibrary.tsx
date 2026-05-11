import { useState } from "react";
import { Library, Upload, Search, Filter, Download, Eye, Trash2, MoreVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudioAsset } from "@/types/studio";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssetLibraryProps {
  assets: StudioAsset[];
  isOwner: boolean;
  onUploadAsset?: (file: File, metadata: Partial<StudioAsset>) => Promise<void>;
  onDeleteAsset?: (assetId: string) => Promise<void>;
  onTogglePublic?: (assetId: string, isPublic: boolean) => Promise<void>;
}

interface FileCategoryCount {
  [key: string]: number;
}

export function AssetLibrary({
  assets,
  isOwner,
  onUploadAsset,
  onDeleteAsset,
  onTogglePublic,
}: AssetLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await onUploadAsset?.(file, {
        name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      setUploadingFile(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: FileCategoryCount = assets.reduce((acc, asset) => {
    const category = asset.category || "uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as FileCategoryCount);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Asset Library</h3>
          <span className="ml-2 px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm font-medium">
            {assets.length}
          </span>
        </div>
        {isOwner && (
          <label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <Button asChild size="sm" className="gap-2 cursor-pointer" disabled={loading}>
              <span>
                <Upload className="w-4 h-4" />
                {loading ? "Uploading..." : "Upload Asset"}
              </span>
            </Button>
          </label>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Category Filter */}
        {Object.keys(categories).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All ({assets.length})
            </Button>
            {Object.entries(categories).map(([category, count]) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:border-violet-400 dark:hover:border-violet-600"
            >
              {/* Preview */}
              <div className="h-40 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-400 opacity-50" />
                  </div>
                )}
                {asset.is_public && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Public
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate flex-1">
                    {asset.name}
                  </h4>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onTogglePublic?.(asset.id, !asset.is_public)}
                        >
                          {asset.is_public ? "Make Private" : "Make Public"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteAsset?.(asset.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {asset.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {formatFileSize(asset.file_size)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Library className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          {assets.length === 0 ? (
            <>
              <p className="text-slate-600 dark:text-slate-400 mb-4">No assets yet</p>
              {isOwner && (
                <label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <Button asChild size="sm" variant="outline">
                    <span className="gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload Your First Asset
                    </span>
                  </Button>
                </label>
              )}
            </>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">No assets match your search</p>
          )}
        </div>
      )}
    </div>
  );
}
