import heroBanner from "@/assets/hero-banner.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, ShieldCheck, Swords, Users, Zap } from "lucide-react";

export const Hero = () => {
  const quickStats = [
    { label: "5 classes", icon: <Swords className="h-4 w-4" /> },
    { label: "4 biomas", icon: <Zap className="h-4 w-4" /> },
    { label: "PvP & PvE", icon: <Users className="h-4 w-4" /> },
    { label: "Conta segura", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <section className="relative overflow-hidden bg-[image:var(--gradient-hero)]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:py-16 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Badge variant="secondary" className="gap-2">
              <Swords className="h-3.5 w-3.5" />
              O MMORPG do Sertão Brasileiro
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            ZIV DUEL
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="text-pretty text-base text-muted-foreground"
          >
            Um MMORPG 2D inspirado na cultura e biodiversidade do Nordeste: explore biomas únicos, dome montarias nativas e evolua teu personagem com builds insanas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-11 px-6">
              <Link to="/auth">Jogar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <a href="#features">Ver recursos</a>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickStats.map((item) => (
              <div key={item.label} className="rounded-xl border bg-background/70 p-3 text-sm backdrop-blur">
                <div className="flex items-center gap-2 text-foreground">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-warm)]">
            <img
              src={heroBanner}
              alt="Paisagem do sertão ao pôr do sol"
              className="h-72 w-full object-cover sm:h-80 lg:h-[460px]"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge style={{ background: "hsl(var(--warrior))", color: "white" }}>⚔️ Guerreiro</Badge>
                <Badge style={{ background: "hsl(var(--mage))", color: "white" }}>🔮 Mago</Badge>
                <Badge style={{ background: "hsl(var(--archer))", color: "white" }}>🏹 Arqueiro</Badge>
                <Badge style={{ background: "hsl(var(--healer))", color: "white" }}>💚 Curandeiro</Badge>
                <Badge style={{ background: "hsl(var(--assassin))", color: "white" }}>🗡️ Assassino</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center pb-10">
        <a
          href="#features"
          className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Rolar para a seção de recursos"
        >
          <ChevronDown className="h-4 w-4" />
          Explorar
        </a>
      </div>
    </section>
  );
};
