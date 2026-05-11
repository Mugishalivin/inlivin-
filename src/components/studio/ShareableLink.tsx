import { useState } from "react";
import { Share2, Copy, Check, Lock, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ShareableLinkProps {
  projectId: string;
  projectName: string;
  currentVisibility: "public" | "private" | "collaborators_only";
  onVisibilityChange?: (visibility: string) => Promise<void>;
}

export function ShareableLink({
  projectId,
  projectName,
  currentVisibility,
  onVisibilityChange,
}: ShareableLinkProps) {
  const [openShare, setOpenShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = `${window.location.origin}/project-preview/${projectId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisibilityChange = async (visibility: string) => {
    setLoading(true);
    try {
      await onVisibilityChange?.(visibility);
      toast.success("Visibility updated!");
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    {
      value: "private",
      label: "Private",
      description: "Only collaborators can view",
      icon: Lock,
    },
    {
      value: "collaborators_only",
      label: "Collaborators Only",
      description: "Team members can view",
      icon: Users,
    },
    {
      value: "public",
      label: "Public",
      description: "Anyone with the link can view",
      icon: Globe,
    },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpenShare(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <Dialog open={openShare} onOpenChange={setOpenShare}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{projectName}"</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Visibility options */}
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                Who can view this project?
              </label>
              <div className="space-y-2">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleVisibilityChange(option.value)}
                      disabled={loading}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        currentVisibility === option.value
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-violet-300"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-0.5 text-violet-600" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {option.label}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share link */}
            {currentVisibility !== "private" && (
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
              💡 Anyone with a public or collaborator link can view this project without logging in.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
