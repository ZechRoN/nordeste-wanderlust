import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const World = () => {
  const biomes = [
    {
      name: "Caatinga",
      description: "Vegetação seca adaptada ao clima semiárido, lar de animais resistentes como o veado-catingueiro e a jaguatirica.",
      animals: ["Veado-catingueiro", "Jaguatirica", "Tatu", "Preá"],
      color: "bg-gradient-caatinga"
    },
    {
      name: "Agreste", 
      description: "Zona de transição com vegetação mista, onde vivem capivaras, macacos-prego e uma grande variedade de aves.",
      animals: ["Capivara", "Macaco-prego", "Sagui", "Bem-te-vi"],
      color: "bg-gradient-forest"
    },
    {
      name: "Litoral",
      description: "Costa atlântica com mangues e praias, habitat de tartarugas marinhas, peixes-boi e golfinhos.",
      animals: ["Tartaruga-marinha", "Peixe-boi", "Golfinho", "Caranguejo"],
      color: "bg-gradient-ocean"
    },
    {
      name: "Santa Cruz do Capibaribe",
      description: "Capital vibrante do mundo de Oxente, centro de comércio e aventuras onde aventureiros se reúnem.",
      animals: ["Caramelo", "Papagaio", "Canário", "Louro José"],
      color: "bg-primary"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            O Mundo de Oxente
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore biomas autênticos do Nordeste brasileiro, cada um com sua fauna única, 
            recursos especiais e desafios específicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {biomes.map((biome, index) => (
            <Card key={index} className="overflow-hidden group hover:shadow-warm transition-shadow duration-300">
              <div className={`h-32 ${biome.color} flex items-center justify-center`}>
                <h3 className="text-3xl font-bold text-primary-foreground">{biome.name}</h3>
              </div>
              <div className="p-8">
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {biome.description}
                </p>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-card-foreground">Fauna Local:</h4>
                  <div className="flex flex-wrap gap-2">
                    {biome.animals.map((animal, animalIndex) => (
                      <Badge key={animalIndex} variant="secondary" className="text-sm">
                        {animal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-hero rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-6">
            Domine as Montarias Nativas
          </h3>
          <p className="text-xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed">
            Cada bioma oferece diferentes montarias para domar: desde a majestosa <strong>onça-pintada</strong> 
            da caatinga até os ágeis <strong>golfinhos</strong> do litoral. Cada montaria possui atributos únicos de 
            velocidade, resistência e habilidades especiais como furtividade, natação ou coleta aprimorada.
          </p>
        </div>
      </div>
    </section>
  );
};