import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Download, Loader2 } from "lucide-react";
import {
  generatePDFReport,
  getReportDescription,
  REPORT_TYPES,
  type ReportType,
  type ReportData,
} from "@/lib/report-generator";

interface ReportDialogProps {
  reportData: ReportData;
  onOpen?: () => void;
  onClose?: () => void;
}

export function ReportDialog({ reportData, onOpen, onClose }: ReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
      setSelectedReport(null);
    }
  };

  const handleGenerateReport = async (type: ReportType) => {
    setIsGenerating(true);
    try {
      const dataWithType: ReportData = {
        ...reportData,
        reportType: type,
        timestamp: new Date(),
      };
      await generatePDFReport(type, dataWithType);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully`);
      setSelectedReport(null);
      handleOpenChange(false);
    } catch (error) {
      toast.error("Failed to generate report. Please try again.");
      console.error("Report generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Generate System Report</DialogTitle>
          <DialogDescription className="text-slate-300">
            Select a report type to analyze different aspects of your system and export as PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {REPORT_TYPES.map((reportType) => (
            <Card
              key={reportType}
              className={`cursor-pointer border transition-all duration-200 ${
                selectedReport === reportType
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setSelectedReport(reportType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base text-white capitalize">{reportType} Report</CardTitle>
                    <CardDescription className="text-xs text-slate-300 mt-1">
                      {getReportDescription(reportType)}
                    </CardDescription>
                  </div>
                  <Badge className="mt-1 bg-white/20 text-white border-white/30">{reportType}</Badge>
                </div>
              </CardHeader>
              {selectedReport === reportType && (
                <CardContent>
                  <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-100">
                      ✓ Report selected. Click "Export Report" below to download as PDF.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleGenerateReport(reportType)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <p className="text-xs text-slate-400">
            {selectedReport ? `Selected: ${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report` : "Select a report type to continue"}
          </p>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
