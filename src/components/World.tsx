import { motion } from "framer-motion";

export const World = () => {
  const biomes = [
    { name: 'Caatinga', emoji: '🌵', desc: 'Sertão semiárido com fauna resistente', animals: ['Veado-catingueiro', 'Jaguatirica', 'Tatu', 'Preá'] },
    { name: 'Agreste', emoji: '🌿', desc: 'Transição com vegetação mista', animals: ['Capivara', 'Macaco-prego', 'Sagui', 'Bem-te-vi'] },
    { name: 'Litoral', emoji: '🌊', desc: 'Costa com mangues e praias', animals: ['Tartaruga', 'Peixe-boi', 'Golfinho', 'Caranguejo'] },
    { name: 'Santa Cruz', emoji: '🏘️', desc: 'Capital comercial de Oxente', animals: ['Caramelo', 'Papagaio', 'Canário', 'Louro José'] },
  ];

  return (
    <section className="py-20 rpg-game-bg" style={{ borderTop: '3px solid hsl(var(--rpg-frame-dark))' }}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="rpg-panel-title text-2xl mb-3" style={{ color: 'hsl(var(--rpg-gold))' }}>
            O Mundo de Oxente
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
            Biomas autênticos do Nordeste com fauna e recursos únicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
          {biomes.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rpg-combatant"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <h3 className="rpg-combatant-name" style={{ color: 'hsl(var(--rpg-gold))' }}>{b.name}</h3>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--rpg-text-dim))' }}>{b.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {b.animals.map(a => (
                  <span
                    key={a}
                    className="rpg-combatant-level"
                    style={{ fontSize: 9 }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rpg-item-detail max-w-lg mx-auto text-center">
          <h3 className="font-bold text-sm pixel-text mb-2" style={{ color: 'hsl(var(--rpg-gold))' }}>
            🐴 Montarias Nativas
          </h3>
          <p className="text-[11px]" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
            Dome animais de cada bioma: <strong>onça-pintada</strong>, <strong>capivara</strong>,{' '}
            <strong>golfinhos</strong> e mais. Cada uma com habilidades únicas!
          </p>
        </div>
      </div>
    </section>
  );
};
