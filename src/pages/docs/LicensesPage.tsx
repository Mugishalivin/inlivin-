import { DocsLayout } from "@/components/DocsLayout";
import { Award, Code2, Shield } from "lucide-react";

export function LicensesPage() {
  return (
    <DocsLayout
      title="Licenses & Attributions"
      description="Open source software and third-party licenses"
      breadcrumbs={[{ label: "Legal", href: "/docs" }]}
    >
      <div className="space-y-12">
        <p className="text-lg text-muted-foreground">
          Last updated: April 2026
        </p>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Our Licenses</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3 mb-2">
                <Shield className="text-primary flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">inlivin Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Proprietary © 2026 Inlivin Inc. All rights reserved.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3 mb-2">
                <Code2 className="text-primary flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Licensed under Creative Commons Attribution 4.0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Open Source Dependencies</h2>
          <div className="space-y-3">
            {[
              {
                name: "React",
                license: "MIT",
                description: "JavaScript library for building user interfaces",
              },
              {
                name: "TypeScript",
                license: "Apache 2.0",
                description: "Typed superset of JavaScript",
              },
              {
                name: "TailwindCSS",
                license: "MIT",
                description: "Utility-first CSS framework",
              },
              {
                name: "Vite",
                license: "MIT",
                description: "Next generation frontend tooling",
              },
              {
                name: "Supabase",
                license: "Apache 2.0",
                description: "Open source Firebase alternative",
              },
              {
                name: "PostgreSQL",
                license: "PostgreSQL License",
                description: "Advanced open source database",
              },
            ].map((lib, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{lib.name}</h3>
                  <p className="text-sm text-muted-foreground">{lib.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                  {lib.license}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Popular Licenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "MIT License",
                description: "Permissive, allows commercial use with attribution",
              },
              {
                name: "Apache 2.0",
                description: "Open source license with clear patent grants",
              },
            ].map((license, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-1">{license.name}</h3>
                <p className="text-sm text-muted-foreground">{license.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Award className="text-primary" size={24} />
            Compliance
          </h2>
          <p className="text-muted-foreground">
            We comply with all open source licenses and maintain proper attribution and
            copyright notices for all dependencies.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
