import { ArrowRight, Zap } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-8 animate-fade-up">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              Ready to Transform Your Creativity?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join 500K+ creators building their dreams on inlivin today. Start free, scale unlimited.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative overflow-hidden px-8 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                Get Started Free
                <Zap size={20} className="group-hover:animate-pulse" />
              </div>
            </button>

            <button className="group px-8 py-4 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2">
              View Documentation
              <ArrowRight
                size={20}
                className="group-hover:translate-x-2 transition-transform duration-300"
              />
            </button>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 border-t border-border/50 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
