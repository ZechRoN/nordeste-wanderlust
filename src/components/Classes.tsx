import { motion } from "framer-motion";

export const Classes = () => {
  const classes = [
    { name: 'Guerreiro', icon: '⚔️', attr: 'Força', spec: 'Ataque em Área', desc: 'Mestre do combate corpo a corpo com força bruta e resistência.' },
    { name: 'Mago', icon: '🔮', attr: 'Inteligência', spec: 'Magia Elemental', desc: 'Manipulador dos elementos com magias devastadoras à distância.' },
    { name: 'Arqueiro', icon: '🏹', attr: 'Agilidade', spec: 'Ataque à Distância', desc: 'Preciso e letal, elimina inimigos antes que se aproximem.' },
    { name: 'Curandeiro', icon: '💚', attr: 'Vontade', spec: 'Cura e Buff', desc: 'Guardião da vida, mantém aliados vivos e fortalecidos.' },
    { name: 'Assassino', icon: '🗡️', attr: 'Velocidade', spec: 'Ataque Crítico', desc: 'Sombra mortal com ataques críticos devastadores.' },
  ];

  return (
    <section className="py-20" style={{ background: 'hsl(var(--rpg-panel-inner))', borderTop: '3px solid hsl(var(--rpg-frame-dark))' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="rpg-panel-title text-2xl mb-3" style={{ color: 'hsl(var(--rpg-gold))' }}>
            Escolha Sua Classe
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
            Cinco classes com sistema de subclasses híbridas e builds únicas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-8">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rpg-class-card text-center hover:rpg-class-selected transition-all"
            >
              <span className="text-4xl block mb-2">{cls.icon}</span>
              <h3 className="font-bold pixel-text text-sm mb-1" style={{ color: 'hsl(var(--rpg-gold))' }}>
                {cls.name}
              </h3>
              <div className="text-[9px] space-y-1 mb-2" style={{ color: 'hsl(var(--rpg-text-dim))' }}>
                <p>+{cls.attr}</p>
                <p>{cls.spec}</p>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
                {cls.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="rpg-item-detail max-w-lg mx-auto text-center">
          <h3 className="font-bold text-sm pixel-text mb-2" style={{ color: 'hsl(var(--rpg-gold))' }}>
            Builds Híbridas
          </h3>
          <p className="text-[11px]" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
            Combine habilidades: <span style={{ color: 'hsl(0 60% 55%)' }}>Guerreiro/Arqueiro</span>,{' '}
            <span style={{ color: 'hsl(270 60% 60%)' }}>Mago/Curandeiro</span>,{' '}
            <span style={{ color: 'hsl(0 0% 70%)' }}>Assassino/Arqueiro</span>
          </p>
        </div>
      </div>
    </section>
  );
};
