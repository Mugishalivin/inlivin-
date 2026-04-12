import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Package,
  Users,
  BookOpen,
  Scale,
  ChevronDown,
  Home,
  Zap,
  DollarSign,
  GitBranch,
  MessageCircle,
  Share2,
  Calendar,
  HelpCircle,
  Code,
  AlertCircle,
  Lock,
  FileText,
  Cookie,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavCategory {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navigation: NavCategory[] = [
  {
    title: "Product",
    icon: <Package size={20} />,
    items: [
      { name: "Features", href: "/docs/features", icon: <Zap size={16} /> },
      { name: "Pricing", href: "/docs/pricing", icon: <DollarSign size={16} /> },
      { name: "Changelog", href: "/docs/changelog", icon: <GitBranch size={16} /> },
      { name: "Roadmap", href: "/docs/roadmap", icon: <BookOpen size={16} /> },
    ],
  },
  {
    title: "Community",
    icon: <Users size={20} />,
    items: [
      { name: "Discord", href: "/docs/discord", icon: <MessageCircle size={16} /> },
      { name: "Twitter/X", href: "/docs/twitter", icon: <Share2 size={16} /> },
      { name: "Blog", href: "/docs/blog", icon: <FileText size={16} /> },
      { name: "Events", href: "/docs/events", icon: <Calendar size={16} /> },
    ],
  },
  {
    title: "Resources",
    icon: <BookOpen size={20} />,
    items: [
      { name: "Help Center", href: "/docs/help-center", icon: <HelpCircle size={16} /> },
      { name: "API Docs", href: "/docs/api", icon: <Code size={16} /> },
      { name: "Tutorials", href: "/docs/tutorials", icon: <BookOpen size={16} /> },
      { name: "Status", href: "/docs/status", icon: <AlertCircle size={16} /> },
    ],
  },
  {
    title: "Legal",
    icon: <Scale size={20} />,
    items: [
      { name: "Privacy Policy", href: "/docs/privacy", icon: <Lock size={16} /> },
      { name: "Terms of Service", href: "/docs/terms", icon: <FileText size={16} /> },
      { name: "Cookies Policy", href: "/docs/cookies", icon: <Cookie size={16} /> },
      { name: "Licenses", href: "/docs/licenses", icon: <Award size={16} /> },
    ],
  },
];

interface DocsSidebarProps {
  onClose?: () => void;
}

export function DocsSidebar({ onClose }: DocsSidebarProps) {
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    navigation[0].title,
  ]);

  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <a href="/docs" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Home size={16} className="text-primary" />
          </div>
          <span className="font-display font-bold text-foreground">
            inlivin<span className="text-primary">.</span>docs
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navigation.map((category) => (
          <div key={category.title}>
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{category.icon}</span>
                {category.title}
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  expandedCategories.includes(category.title) ? "rotate-180" : ""
                )}
              />
            </button>

            {expandedCategories.includes(category.title) && (
              <div className="mt-2 space-y-1 ml-3">
                {category.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>← Back to Home</span>
        </a>
      </div>
    </div>
  );
}
