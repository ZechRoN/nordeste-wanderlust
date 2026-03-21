import { Link } from "react-router-dom";
import { Sword, Zap, Target, Heart, UserX, Shield, Globe, Users, Trophy, Hammer, Mountain, ChevronDown, Swords } from "lucide-react";
import { GameButton } from "@/components/ui/game-panel";
import { motion } from "framer-motion";

export const Hero = () => {
  const classes = [
    { name: 'Guerreiro', icon: '⚔️', color: 'hsl(0 60% 55%)' },
    { name: 'Mago', icon: '🔮', color: 'hsl(270 60% 60%)' },
    { name: 'Arqueiro', icon: '🏹', color: 'hsl(120 50% 50%)' },
    { name: 'Curandeiro', icon: '💚', color: 'hsl(150 60% 45%)' },
    { name: 'Assassino', icon: '🗡️', color: 'hsl(0 0% 70%)' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden rpg-game-bg">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: `hsl(${30 + Math.random() * 30} ${40 + Math.random() * 30}% ${40 + Math.random() * 20}% / 0.3)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="rpg-panel inline-block mb-6" style={{ padding: 0 }}>
              <div className="rpg-panel-header" style={{ padding: '12px 40px' }}>
                <h1
                  className="rpg-panel-title"
                  style={{ fontSize: 'clamp(36px, 8vw, 64px)', letterSpacing: 4 }}
                >
                  ZIV DUEL
                </h1>
              </div>
              <div className="rpg-panel-content" style={{ margin: 2, padding: '8px 24px' }}>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(var(--rpg-text-dim))' }}>
                  O Mundo de Oxente
                </p>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}
          >
            Um MMORPG 2D inspirado na rica cultura e biodiversidade do Nordeste brasileiro.
            Explore biomas únicos, dome montarias nativas e viva aventuras épicas.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Link to="/auth">
              <GameButton variant="gold" size="lg" className="min-w-48 text-base">
                <Swords className="h-5 w-5 mr-2" /> Jogar Agora
              </GameButton>
            </Link>
            <GameButton variant="secondary" size="lg" className="min-w-48 text-base">
              Ver Trailer
            </GameButton>
          </motion.div>

          {/* Class showcase */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-4 flex-wrap"
          >
            {classes.map((cls, i) => (
              <motion.div
                key={cls.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="rpg-slot rpg-slot-filled cursor-pointer"
                style={{ width: 64, height: 64, maxWidth: 64, borderColor: cls.color }}
                title={cls.name}
              >
                <span className="text-2xl">{cls.icon}</span>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-[10px] mt-2 opacity-30" style={{ fontFamily: "'Courier New', monospace" }}>
            Guerreiro • Mago • Arqueiro • Curandeiro • Assassino
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronDown className="h-6 w-6" style={{ color: 'hsl(var(--rpg-text-dim))' }} />
      </motion.div>
    </section>
  );
};
