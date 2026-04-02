import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Classes = () => {
  const classes = [
    { key: "warrior", name: "Guerreiro", icon: "⚔️", attr: "Força", spec: "Ataque em área", desc: "Combate corpo a corpo com força bruta e resistência." },
    { key: "mage", name: "Mago", icon: "🔮", attr: "Inteligência", spec: "Magia elemental", desc: "Magias devastadoras à distância e controle de campo." },
    { key: "archer", name: "Arqueiro", icon: "🏹", attr: "Agilidade", spec: "Ataque à distância", desc: "Preciso e letal: elimina antes que cheguem perto." },
    { key: "healer", name: "Curandeiro", icon: "💚", attr: "Vontade", spec: "Cura e buff", desc: "Sustenta o time e transforma fight perdido em vitória." },
    { key: "assassin", name: "Assassino", icon: "🗡️", attr: "Velocidade", spec: "Crítico", desc: "Dano explosivo e mobilidade, do jeitinho que dói." },
  ];

  return (
    <section id="classes" className="border-t bg-muted/20 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Escolha tua classe</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Cinco classes com estilos bem marcados e espaço pra builds híbridas.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-warm)]">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{cls.icon}</span>
                    <Badge style={{ background: `hsl(var(--${cls.key}))`, color: "white" }}>{cls.name}</Badge>
                  </div>
                  <CardTitle className="text-sm">{cls.spec}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">Atributo base: <span className="text-foreground">{cls.attr}</span></div>
                  <p className="text-sm text-muted-foreground">{cls.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-background p-5 text-center shadow-[var(--shadow-cool)]">
          <div className="text-sm font-semibold">Builds híbridas</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Misture estilos e cria tua assinatura:{" "}
            <span className="font-medium text-foreground">Guerreiro/Arqueiro</span>,{" "}
            <span className="font-medium text-foreground">Mago/Curandeiro</span>,{" "}
            <span className="font-medium text-foreground">Assassino/Arqueiro</span>.
          </p>
        </div>
      </div>
    </section>
  );
};
