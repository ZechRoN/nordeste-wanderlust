import { Globe, Users, Zap, Trophy, Hammer, Mountain } from "lucide-react";
import { motion } from "framer-motion";

export const Features = () => {
  const features = [
    { icon: <Globe className="w-8 h-8" />, title: "Mundo Aberto", desc: "Explore biomas únicos do Nordeste: caatinga, agreste, litoral e Santa Cruz do Capibaribe." },
    { icon: <Users className="w-8 h-8" />, title: "PvP & PvE", desc: "Arena PvP, combate contra criaturas, bosses de evento e sistema de party cooperativa." },
    { icon: <Zap className="w-8 h-8" />, title: "Progressão", desc: "Sistema de níveis com builds únicas, subclasses e distribuição livre de atributos." },
    { icon: <Trophy className="w-8 h-8" />, title: "Títulos & Conquistas", desc: "35+ títulos de prestígio através de quests, dungeons, PvP e eventos especiais." },
    { icon: <Hammer className="w-8 h-8" />, title: "Crafting", desc: "15+ profissões com receitas, materiais de bioma e economia dinâmica." },
    { icon: <Mountain className="w-8 h-8" />, title: "Montarias", desc: "Dome animais nativos: onça-pintada, capivara, jaguatirica e muitos outros." },
  ];

  return (
    <section className="py-20 rpg-game-bg" style={{ borderTop: '3px solid hsl(var(--rpg-frame-dark))' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="rpg-panel-title text-2xl mb-3" style={{ color: 'hsl(var(--rpg-gold))' }}>
            Características Únicas
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
            Cultura brasileira + mecânicas MMORPG profundas = experiência única
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rpg-item-detail group hover:border-[hsl(var(--rpg-gold)/0.4)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span style={{ color: 'hsl(var(--rpg-gold))' }}>{f.icon}</span>
                <div>
                  <h3 className="font-bold text-sm pixel-text mb-1" style={{ color: 'hsl(var(--rpg-text))' }}>
                    {f.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
