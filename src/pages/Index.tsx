import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Classes } from "@/components/Classes";
import { World } from "@/components/World";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, Swords } from "lucide-react";

const Index = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const navItems = [
    { label: "Recursos", href: "#features" },
    { label: "Classes", href: "#classes" },
    { label: "Mundo", href: "#world" },
    { label: "Comunidade", href: "#community" },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <header id="top" className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Swords className="h-4 w-4" />
              </span>
              <span>ZIV DUEL</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="h-9 px-3">
                  <a href={item.href}>{item.label}</a>
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={resolvedTheme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button asChild className="hidden sm:inline-flex">
              <Link to="/auth">Jogar agora</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[320px]">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-semibold">Explorar</div>
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Button asChild variant="ghost" className="justify-start">
                          <a href={item.href}>{item.label}</a>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                  <div className="mt-2">
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link to="/auth">Jogar agora</Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main" className="min-h-screen">
        <Hero />
        <Features />
        <Classes />
        <World />
        <Footer />
      </main>
    </>
  );
};

export default Index;
