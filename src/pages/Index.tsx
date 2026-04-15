import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { DiscoverSection } from "@/components/DiscoverSection";
import { CommunitySection } from "@/components/CommunitySection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

// Lazy load heavy components
const InteractiveStats = lazy(() => import("@/components/InteractiveStats"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const Creator3DChain = lazy(() => import("@/components/Creator3DChain"));
const SuccessStoriesSection = lazy(() => import("@/components/SuccessStoriesSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const TrendingProjectsSection = lazy(() => import("@/components/TrendingProjectsSection"));
const UseCasesSection = lazy(() => import("@/components/UseCasesSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const FinalCTASection = lazy(() => import("@/components/FinalCTASection"));

const Index = () => {
  const { user, loading, role, adminViewMode, authRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if ((role === "admin" || authRole === "admin") && !adminViewMode) {
        navigate("/continue-as", { replace: true });
      } else if ((role === "admin" || authRole === "admin") && adminViewMode === "admin") {
        navigate("/admin/overview", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate, role, adminViewMode, authRole]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Suspense fallback={null}>
        <InteractiveStats />
      </Suspense>
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <Suspense fallback={null}>
        <Creator3DChain />
      </Suspense>
      <div className="section-divider" />
      <Suspense fallback={null}>
        <SuccessStoriesSection />
      </Suspense>
      <div className="section-divider" />
      <Suspense fallback={null}>
        <HowItWorksSection />
      </Suspense>
      <div className="section-divider" />
      <Suspense fallback={null}>
        <TrendingProjectsSection />
      </Suspense>
      <div className="section-divider" />
      <DiscoverSection />
      <div className="section-divider" />
      <Suspense fallback={null}>
        <UseCasesSection />
      </Suspense>
      <div className="section-divider" />
      <CommunitySection />
      <div className="section-divider" />
      <PricingSection />
      <div className="section-divider" />
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>
      <div className="section-divider" />
      <Suspense fallback={null}>
        <FAQSection />
      </Suspense>
      <div className="section-divider" />
      <CTASection />
      <Suspense fallback={null}>
        <FinalCTASection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
