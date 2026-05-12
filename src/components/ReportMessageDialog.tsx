import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase as supabaseRaw } from "@/integrations/supabase/client";
const supabase: any = supabaseRaw;
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface ReportMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  reportedUserId: string;
  messageSender: string;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export function ReportMessageDialog({
  isOpen,
  onOpenChange,
  messageId,
  reportedUserId,
  messageSender,
}: ReportMessageDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("message_reports")
        .insert({
          message_id: messageId,
          reported_user: reportedUserId,
          reason: selectedReason,
          description: description || null,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Report submitted. Thank you for helping keep our community safe.");
      setSelectedReason("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogDescription className="sr-only">Report this message for violation of community guidelines. Select a reason and provide details if needed.</DialogDescription>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" /> Report Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Why are you reporting this message?</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Additional details (optional)</label>
            <Textarea
              placeholder="Provide more context about why you're reporting this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="text-xs text-gray-500">
            We take reports seriously. Your report will be reviewed by our moderation team.
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmitting || !selectedReason}
              className="flex-1"
              variant="destructive"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
