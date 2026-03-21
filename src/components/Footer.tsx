import { Link } from "react-router-dom";
import { GameButton } from "@/components/ui/game-panel";
import { Swords } from "lucide-react";

export const Footer = () => {
  return (
    <footer style={{ background: 'hsl(var(--rpg-frame-dark))', borderTop: '3px solid hsl(var(--rpg-frame-light))' }}>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="rpg-panel-title text-xl mb-3" style={{ color: 'hsl(var(--rpg-gold))' }}>ZIV DUEL</h3>
            <p className="text-[11px] leading-relaxed mb-4" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
              O primeiro MMORPG brasileiro inspirado na biodiversidade do Nordeste. Entre no mundo de Oxente.
            </p>
            <div className="flex gap-2">
              <GameButton variant="secondary" size="sm">Discord</GameButton>
              <GameButton variant="secondary" size="sm">YouTube</GameButton>
            </div>
          </div>

          <div>
            <h4 className="rpg-label mb-3">Jogo</h4>
            <ul className="space-y-1 text-[11px]" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Guia de Classes</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Mapa do Mundo</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Patch Notes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="rpg-label mb-3">Comunidade</h4>
            <ul className="space-y-1 text-[11px]" style={{ color: 'hsl(var(--rpg-text-dim))', fontFamily: "'Courier New', monospace" }}>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Rankings</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Eventos</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--rpg-gold))] transition-colors">Suporte</a></li>
            </ul>
          </div>
        </div>

        <div className="rpg-item-detail text-center mb-6">
          <h4 className="rpg-label mb-2">Pronto para a Aventura?</h4>
          <Link to="/auth">
            <GameButton variant="gold" size="lg">
              <Swords className="h-4 w-4 mr-2" /> Jogar Agora
            </GameButton>
          </Link>
        </div>

        <div className="text-center text-[10px]" style={{ color: 'hsl(var(--rpg-text-dim) / 0.5)', fontFamily: "'Courier New', monospace" }}>
          <p>&copy; 2024 Ziv Duel. Orgulhosamente brasileiro.</p>
        </div>
      </div>
    </footer>
  );
};
