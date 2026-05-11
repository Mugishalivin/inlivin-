import { useState } from "react";
import { Users, Settings, Share2, Edit, ArrowRight, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Studio } from "@/types/studio";

interface StudioHeaderProps {
  studio: Studio;
  isOwner: boolean;
  memberCount: number;
  projectCount: number;
  onUpdate?: (updates: Partial<Studio>) => Promise<void>;
}

export function StudioHeader({ studio, isOwner, memberCount, projectCount, onUpdate }: StudioHeaderProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: studio.name,
    description: studio.description || "",
    bio: studio.bio || "",
    location: studio.location || "",
    website: studio.website || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate?.(formData);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-8">
      {/* Cover Image */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-lg overflow-hidden mb-6">
        {studio.cover_url && (
          <img src={studio.cover_url} alt={studio.name} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Studio Info Card */}
      <div className="px-4 sm:px-6 -mt-12 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center overflow-hidden">
                {studio.avatar_url ? (
                  <img src={studio.avatar_url} alt={studio.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{studio.name.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* Studio Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">{studio.name}</h1>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>

                {studio.description && (
                  <p className="text-slate-600 dark:text-slate-400 mb-3">{studio.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  {studio.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {studio.location}
                    </div>
                  )}
                  {studio.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a href={studio.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{projectCount}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Projects</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{memberCount}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Members</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Studio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Studio Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Studio Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does your studio do?"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
