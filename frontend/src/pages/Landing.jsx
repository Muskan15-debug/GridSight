import FinalCta from "../components/landing/FinalCta";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import LandingNav from "../components/landing/LandingNav";
import ParticleField from "../components/landing/ParticleField";
import Stats from "../components/landing/Stats";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background">
      <ParticleField />
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Stats />
      <FinalCta />
    </div>
  );
}
