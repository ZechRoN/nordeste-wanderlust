import { Card } from "@/components/ui/card";
import { Globe, Users, Zap, Trophy, Hammer, Mountain } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: <Globe className="w-12 h-12" />,
      title: "Mundo Aberto Brasileiro",
      description: "Explore biomas únicos do Nordeste: sertão, agreste, cidades coloniais e litoral atlântico com fauna e flora nativas."
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "PvP & PvE Equilibrado", 
      description: "Sistema de combate balanceado entre jogador vs jogador e PvE, com controle de cidades e eventos de clã."
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Progressão Infinita",
      description: "Sistema de níveis sem limite com builds híbridas, subclasses personalizáveis e distribuição livre de pontos."
    },
    {
      icon: <Trophy className="w-12 h-12" />,
      title: "35 Títulos de Prestígio",
      description: "Conquiste títulos através de quests, dungeons, PvP e eventos. Demonstre seu prestígio social no mundo de Oxente."
    },
    {
      icon: <Hammer className="w-12 h-12" />,
      title: "Profissões & Crafting",
      description: "Mais de 15 profissões disponíveis com eventos de farming aleatórios e economia dinâmica baseada na região."
    },
    {
      icon: <Mountain className="w-12 h-12" />,
      title: "Montarias Nativas",
      description: "Dome animais típicos brasileiros: onça-pintada, capivara, jaguatirica, veado-catingueiro e muitos outros."
    }
  ];

  return (
    <section className="py-24 bg-gradient-caatinga">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Características Únicas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ziv Duel combina a rica cultura brasileira com mecânicas MMORPG profundas, 
            criando uma experiência única e autêntica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 hover:shadow-warm transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
              <div className="text-primary mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-semibold text-card-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};