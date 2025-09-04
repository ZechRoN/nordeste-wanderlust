import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <h3 className="text-3xl font-bold mb-4">ZIV DUEL</h3>
            <p className="text-background/80 mb-6 max-w-md">
              O primeiro MMORPG brasileiro inspirado na rica cultura e biodiversidade do Nordeste. 
              Entre no mundo de Oxente e viva aventuras épicas.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-background text-background hover:bg-background hover:text-foreground">
                Discord
              </Button>
              <Button variant="outline" size="sm" className="border-background text-background hover:bg-background hover:text-foreground">
                Facebook
              </Button>
              <Button variant="outline" size="sm" className="border-background text-background hover:bg-background hover:text-foreground">
                YouTube
              </Button>
            </div>
          </div>

          {/* Game Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Jogo</h4>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Download</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Requisitos</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Guia de Classes</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Mapa do Mundo</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Patch Notes</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Comunidade</h4>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Fórum</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Rankings</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Eventos</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Suporte</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Bug Reports</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-xl font-semibold mb-4">Receba Novidades</h4>
            <p className="text-background/80 mb-4">
              Fique por dentro das últimas atualizações, eventos e novidades do mundo de Oxente.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Seu e-mail" 
                className="bg-background/10 border-background/30 text-background placeholder:text-background/60"
              />
              <Button variant="outline" className="border-background text-background hover:bg-background hover:text-foreground">
                Inscrever
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-background/60 text-sm">
          <p>&copy; 2024 Ziv Duel. Todos os direitos reservados. Orgulhosamente brasileiro.</p>
        </div>
      </div>
    </footer>
  );
};