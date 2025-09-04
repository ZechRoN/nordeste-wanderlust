import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Classes } from "@/components/Classes";
import { World } from "@/components/World";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Classes />
      <World />
      <Footer />
    </main>
  );
};

export default Index;