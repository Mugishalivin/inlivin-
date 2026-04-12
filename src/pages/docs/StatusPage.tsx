import { DocsLayout } from "@/components/DocsLayout";
import { AlertCircle, CheckCircle } from "lucide-react";

const services = [
  { name: "Platform", status: "operational", uptime: "99.98%" },
  { name: "API", status: "operational", uptime: "99.99%" },
  { name: "Uploads", status: "operational", uptime: "99.97%" },
  { name: "Live Streaming", status: "operational", uptime: "99.95%" },
  { name: "Marketplace", status: "operational", uptime: "99.99%" },
  { name: "Analytics", status: "operational", uptime: "99.98%" },
];

export function StatusPage() {
  return (
    <DocsLayout
      title="System Status"
      description="Monitor the health and performance of inlivin services"
      breadcrumbs={[{ label: "Resources", href: "/docs" }]}
    >
      <div className="space-y-12">
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-foreground">All Systems Operational</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: April 10, 2026 at 2:15 PM UTC
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Service Status</h2>
          <div className="space-y-3">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {service.status === "operational" ? "Operational" : "Degraded"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {service.uptime} uptime
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Incidents</h2>
          <div className="space-y-3">
            {[
              {
                date: "March 28, 2026",
                service: "Upload Service",
                duration: "15 minutes",
                status: "Resolved",
              },
              {
                date: "March 10, 2026",
                service: "Scheduled Maintenance",
                duration: "1 hour",
                status: "Completed",
              },
            ].map((incident, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-foreground">{incident.service}</h3>
                  <span className="text-xs font-semibold text-green-600">
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {incident.date} • Duration: {incident.duration}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-3">Notifications</h2>
          <p className="text-muted-foreground mb-4">
            Subscribe to status updates via email or Slack
          </p>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Enable Notifications
          </button>
        </div>
      </div>
    </DocsLayout>
  );
}
