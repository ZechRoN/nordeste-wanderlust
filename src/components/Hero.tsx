import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sword, Shield, Target, Heart, Zap, UserX } from "lucide-react";
import heroImage from "@/assets/hero-banner.jpg";
export const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-primary-foreground animate-float">
            ZIV DUEL
          </h1>
          <h2 className="text-2xl md:text-4xl font-semibold mb-8 text-primary-foreground/90">
            Explore o Mundo de <span className="text-accent-foreground bg-accent px-2 py-1 rounded">Oxente</span>
          </h2>
          <p className="text-lg md:text-xl mb-12 text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Um MMORPG 2D inspirado na rica cultura e biodiversidade do Nordeste brasileiro. 
            Domine montarias nativas, explore biomas únicos e viva aventuras épicas em Santa Cruz do Capibaribe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="min-w-48">
                Jogar Agora
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="min-w-48 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Ver Trailer
            </Button>
          </div>

          {/* Class Icons */}
          <div className="flex justify-center gap-8 mt-16">
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="p-4 bg-warrior/20 rounded-full mb-2 group-hover:bg-warrior/40 transition-colors">
                <Sword className="w-8 h-8 text-primary-foreground bg-[#f0f0f0]/0" />
              </div>
              <span className="text-primary-foreground/80 text-sm text-gray-50">Guerreiro</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="p-4 bg-mage/20 rounded-full mb-2 group-hover:bg-mage/40 transition-colors">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/80 text-sm text-gray-50">Mago</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="p-4 bg-archer/20 rounded-full mb-2 group-hover:bg-archer/40 transition-colors">
                <Target className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/80 text-sm text-gray-50">Arqueiro</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="p-4 bg-healer/20 rounded-full mb-2 group-hover:bg-healer/40 transition-colors">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/80 text-sm text-gray-50">Curandeiro</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="p-4 bg-assassin/20 rounded-full mb-2 group-hover:bg-assassin/40 transition-colors">
                <UserX className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/80 text-sm text-gray-50">Assassino</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>;
};