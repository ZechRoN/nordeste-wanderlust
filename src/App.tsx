import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { Div } from "@/components/ui/Div";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Game = lazy(() => import("./pages/Game"));
const Wiki = lazy(() => import("./pages/Wiki"));
const Support = lazy(() => import("./pages/Support"));
const Terms = lazy(() => import("./pages/Terms"));
const Bazar = lazy(() => import("./pages/Bazar"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Coupons = lazy(() => import("./pages/Coupons"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando...</Div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/game" element={<Game />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/suporte" element={<Support />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/bazar" element={<Bazar />} />
                <Route path="/carteira" element={<Wallet />} />
                <Route path="/cupons" element={<Coupons />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
