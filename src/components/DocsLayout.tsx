import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { DocsSidebar } from "./DocsSidebar";

interface DocsLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
  title?: string;
  description?: string;
}

export function DocsLayout({
  children,
  breadcrumbs = [],
  title,
  description,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background transition-transform duration-300 md:sticky md:top-0 md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <DocsSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex-1 md:flex-none">
              {breadcrumbs.length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                  <a href="/docs" className="hover:text-foreground transition-colors">
                    Docs
                  </a>
                  {breadcrumbs.map((crumb, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <ChevronRight size={16} className="flex-shrink-0" />
                      <a
                        href={crumb.href}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {title && (
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {title}
                </h1>
                {description && (
                  <p className="text-lg text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            )}
            <div className="prose prose-sm md:prose-base max-w-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
