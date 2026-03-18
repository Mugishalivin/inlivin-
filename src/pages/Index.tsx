import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { DiscoverSection } from "@/components/DiscoverSection";
import { CommunitySection } from "@/components/CommunitySection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
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
