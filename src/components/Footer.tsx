import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

export const Footer = () => {
  return (
    <footer id="community" className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Swords className="h-4 w-4" />
              </span>
              <span>ZIV DUEL</span>
            </div>
            <p className="text-sm text-muted-foreground">
              MMORPG brasileiro inspirado na biodiversidade do Nordeste. Entre no mundo de Oxente e cria tua história.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="#" rel="noreferrer">Discord</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="#" rel="noreferrer">YouTube</a>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Jogo</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#classes" className="hover:text-foreground">Guia de classes</a></li>
              <li><a href="#world" className="hover:text-foreground">Mapa do mundo</a></li>
              <li><a href="#features" className="hover:text-foreground">Patch notes</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Começar</div>
            <p className="text-sm text-muted-foreground">
              Cria tua conta, escolhe um personagem e entra. A aventura começa em menos de 1 minuto.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/auth">Jogar agora</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; 2026 Ziv Duel. Orgulhosamente brasileiro.</p>
          <div className="flex items-center gap-3">
            <a href="#top" className="hover:text-foreground">Voltar ao topo</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
