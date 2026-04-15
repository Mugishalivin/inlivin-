import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Discover", href: "/#discover" },
  { label: "Community", href: "/#community" },
  { label: "Pricing", href: "/#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          inlivin<span className="text-primary">.</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
              <User size={16} />
              {profile?.display_name || "Dashboard"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/register")}>Get Started</Button>
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container py-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-3 border-b border-border"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-4">
                {user ? (
                  <Button variant="hero" size="sm" className="flex-1" onClick={() => { navigate("/dashboard"); setOpen(false); }}>
                    Dashboard
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 flex-1">
                    {logoutAgo && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-md">
                        <Clock3 size={12} />
                        {logoutAgo}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/login"); setOpen(false); }}>Sign In</Button>
                    <Button variant="hero" size="sm" className="flex-1" onClick={() => { navigate("/register"); setOpen(false); }}>Get Started</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
