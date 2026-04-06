import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Div } from "@/components/ui/Div";

export const World = () => {
  const biomes = [
    { key: "caatinga", name: "Caatinga", emoji: "🌵", desc: "Sertão semiárido com fauna resistente", animals: ["Veado-catingueiro", "Jaguatirica", "Tatu", "Preá"], gradient: "var(--gradient-caatinga)" },
    { key: "agreste", name: "Agreste", emoji: "🌿", desc: "Transição com vegetação mista", animals: ["Capivara", "Macaco-prego", "Sagui", "Bem-te-vi"], gradient: "var(--gradient-forest)" },
    { key: "litoral", name: "Litoral", emoji: "🌊", desc: "Costa com mangues e praias", animals: ["Tartaruga", "Peixe-boi", "Golfinho", "Caranguejo"], gradient: "var(--gradient-ocean)" },
    { key: "santa_cruz", name: "Santa Cruz", emoji: "🏘️", desc: "Capital comercial de Oxente", animals: ["Caramelo", "Papagaio", "Canário", "Louro José"], gradient: "var(--gradient-hero)" },
  ];

  return (
    <section id="world" className="border-t bg-background py-14 sm:py-16">
      <Div className="mx-auto max-w-6xl px-4">
        <Div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">O mundo de Oxente</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Biomas autênticos do Nordeste com fauna, recursos e identidade própria.
          </p>
        </Div>

        <Div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {biomes.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="overflow-hidden">
                <Div className="h-2 w-full" style={{ backgroundImage: b.gradient }} />
                <CardHeader className="space-y-1">
                  <Div className="flex items-center justify-between gap-3">
                    <Div className="flex items-center gap-2">
                      <span className="text-2xl">{b.emoji}</span>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                    </Div>
                    <Badge variant="secondary" className="capitalize">
                      {b.key.replace("_", " ")}
                    </Badge>
                  </Div>
                  <Div className="text-sm text-muted-foreground">{b.desc}</Div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {b.animals.map((a) => (
                    <Badge key={a} variant="outline" className="bg-background">
                      {a}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Div>

        <Div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-muted/30 p-6 text-center">
          <Div className="text-sm font-semibold">🐴 Montarias nativas</Div>
          <p className="mt-2 text-sm text-muted-foreground">
            Dome animais de cada bioma: <span className="font-medium text-foreground">onça-pintada</span>,{" "}
            <span className="font-medium text-foreground">capivara</span>,{" "}
            <span className="font-medium text-foreground">golfinho</span> e mais. Cada uma com habilidade própria.
          </p>
        </Div>
      </Div>
    </section>
  );
};
