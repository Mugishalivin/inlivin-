import { useEffect } from "react";
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
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <DiscoverSection />
      <div className="section-divider" />
      <CommunitySection />
      <div className="section-divider" />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
