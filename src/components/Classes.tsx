import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Zap, Target, Heart, Shield } from "lucide-react";

export const Classes = () => {
  const classes = [
    {
      name: "Guerreiro",
      icon: <Sword className="w-16 h-16" />,
      color: "warrior",
      attribute: "Força",
      specialty: "Ataque em Área",
      description: "Mestre do combate corpo a corpo, o Guerreiro domina o campo de batalha com sua força bruta e resistência. Pode se especializar também como Arqueiro para builds híbridas.",
      buttonVariant: "warrior" as const
    },
    {
      name: "Mago", 
      icon: <Zap className="w-16 h-16" />,
      color: "mage",
      attribute: "Inteligência",
      specialty: "Magia Elemental",
      description: "Manipulador dos elementos, o Mago causa devastação à distância com magias poderosas. Pode combinar habilidades com a classe Curandeiro.",
      buttonVariant: "mage" as const
    },
    {
      name: "Arqueiro",
      icon: <Target className="w-16 h-16" />, 
      color: "archer",
      attribute: "Agilidade",
      specialty: "Ataque à Distância",
      description: "Preciso e letal, o Arqueiro elimina inimigos antes que se aproximem. Combina perfeitamente com habilidades de Guerreiro para versatilidade.",
      buttonVariant: "archer" as const
    },
    {
      name: "Curandeiro",
      icon: <Heart className="w-16 h-16" />,
      color: "healer", 
      attribute: "Vontade",
      specialty: "Cura e Buff",
      description: "Guardião da vida, o Curandeiro mantém aliados vivos e fortalecidos. Pode aprender magias ofensivas da classe Mago.",
      buttonVariant: "healer" as const
    },
    {
      name: "Assassino",
      icon: <Shield className="w-16 h-16" />,
      color: "assassin",
      attribute: "Velocidade", 
      specialty: "Ataque Crítico",
      description: "Sombra mortal, o Assassino elimina alvos com ataques críticos devastadores. Combina bem com habilidades de Arqueiro para maior alcance.",
      buttonVariant: "assassin" as const
    }
  ];

  return (
    <section className="py-24 bg-gradient-forest">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Escolha Sua Classe
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
            Cinco classes principais com sistema de subclasses híbridas. 
            Crie builds únicas combinando habilidades de diferentes classes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {classes.map((classInfo, index) => (
            <Card key={index} className="p-8 bg-card/90 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className={`text-${classInfo.color} mb-6 flex justify-center`}>
                {classInfo.icon}
              </div>
              <h3 className="text-2xl font-bold text-center text-card-foreground mb-4">
                {classInfo.name}
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atributo:</span>
                  <span className="text-card-foreground font-semibold">+{classInfo.attribute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Especialidade:</span>
                  <span className="text-card-foreground font-semibold">{classInfo.specialty}</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {classInfo.description}
              </p>
              <Button 
                variant={classInfo.buttonVariant} 
                className="w-full"
                size="lg"
              >
                Escolher {classInfo.name}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-card-foreground mb-4">
              Sistema de Builds Híbridas
            </h3>
            <p className="text-muted-foreground">
              Cada classe pode escolher uma subclasse, permitindo combinações únicas como 
              <span className="text-warrior font-semibold"> Guerreiro/Arqueiro</span>, 
              <span className="text-mage font-semibold"> Mago/Curandeiro</span>, ou 
              <span className="text-assassin font-semibold"> Assassino/Arqueiro</span>.
              Distribua pontos livremente entre atributos e skills para criar sua build ideal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};