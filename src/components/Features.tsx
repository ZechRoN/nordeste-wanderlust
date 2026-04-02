import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Hammer, Mountain, Trophy, Users, Zap } from "lucide-react";

export const Features = () => {
  const features = [
    { icon: <Globe className="h-5 w-5" />, title: "Mundo aberto", desc: "Explore biomas únicos do Nordeste: caatinga, agreste, litoral e Santa Cruz do Capibaribe." },
    { icon: <Users className="h-5 w-5" />, title: "PvP & PvE", desc: "Arena PvP, criaturas, bosses de evento e party cooperativa." },
    { icon: <Zap className="h-5 w-5" />, title: "Progressão", desc: "Níveis, builds únicas, subclasses e distribuição de atributos." },
    { icon: <Trophy className="h-5 w-5" />, title: "Títulos & conquistas", desc: "Títulos de prestígio via quests, dungeons, PvP e eventos especiais." },
    { icon: <Hammer className="h-5 w-5" />, title: "Crafting", desc: "Profissões, receitas, materiais de bioma e economia dinâmica." },
    { icon: <Mountain className="h-5 w-5" />, title: "Montarias", desc: "Dome animais nativos: onça-pintada, capivara, jaguatirica e mais." },
  ];

  return (
    <section id="features" className="border-t bg-background py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Recursos do jogo</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Cultura brasileira + mecânicas MMORPG profundas = uma experiência diferente (e viciante).
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-cool)]">
                <CardHeader className="space-y-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {f.icon}
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
