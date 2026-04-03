import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flag } from "lucide-react";

type ReportEntityType = "user" | "project" | "event" | "announcement" | "promotion" | "ad";

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: ReportEntityType;
  entityId: string;
  reportedUserId?: string | null;
  entityTitle?: string | null;
  entityLabel?: string | null;
};

const reasons = [
  "Inappropriate content",
  "Spam or scam",
  "Harassment or abuse",
  "False information",
  "Copyright issue",
  "Other",
];

export function ReportDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  reportedUserId,
  entityTitle,
  entityLabel,
}: ReportDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!user?.id) {
      toast.error("Please sign in to report this item.");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedReportedUserId = reportedUserId || (entityType === "user" ? entityId : null);
      const { error } = await adminDb.from("user_reports").insert({
        reporter_id: user.id,
        reported_user_id: resolvedReportedUserId,
        entity_type: entityType,
        entity_id: entityId,
        reason,
        details: {
          report_details: details.trim() || null,
          entity_title: entityTitle || null,
          entity_label: entityLabel || null,
          reported_user_id: resolvedReportedUserId,
        },
      });
      if (error) throw error;

      if (resolvedReportedUserId) {
        await adminDb.from("notifications").insert({
          user_id: resolvedReportedUserId,
          title: "Content reported",
          message: `One of your ${entityType} items was reported and is under review.`,
          type: "report",
          reference_id: entityId,
          reference_type: entityType,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "user-reports"] });
      toast.success("Report sent to admin review.");
      setDetails("");
      setReason(reasons[0]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to send report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            Report {entityLabel || entityType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="flex flex-wrap gap-2">
              {reasons.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={reason === item ? "default" : "outline"}
                  className="border-border bg-background hover:bg-secondary"
                  onClick={() => setReason(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Extra details</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add any useful context for the moderation team."
              className="min-h-28 border-border bg-background"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="border-border bg-background hover:bg-secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={submitting}>
              {submitting ? "Sending..." : "Submit report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
