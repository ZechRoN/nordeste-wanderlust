import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { DiscordIcon } from "@/components/site/DiscordIcon";
import { Div } from "@/components/ui/Div";
import { LifeBuoy, Mail, MessageCircle, ShieldAlert } from "lucide-react";

const FAQ = [
  { q: "Como recupero minha senha?", a: "Use a opção 'Esqueci minha senha' na tela de login. Enviaremos um link de redefinição." },
  { q: "Como compro Cupons?", a: "Acesse a Webshop dentro do site, escolha o pacote desejado e siga o checkout seguro." },
  { q: "Meu personagem foi banido. O que fazer?", a: "Abra um ticket via Discord oficial. Bans são revisados em até 72h por nossa equipe." },
  { q: "Posso transferir personagem entre contas?", a: "Sim, através do Bazar de Personagens, com taxa em Cupons." },
  { q: "Encontrei um bug. Onde reporto?", a: "Use o canal #bugs no Discord ou abra um ticket pelo formulário abaixo." },
];

export default function SupportPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-3 pb-10 space-y-6">
        <GoldFrame>
          <PanelTitle icon={<LifeBuoy className="h-3.5 w-3.5" />}>Central de Suporte</PanelTitle>
          <Div className="mmo-parchment p-6 space-y-4">
            <h1 className="text-2xl font-bold">Como podemos ajudar?</h1>
            <p className="text-sm">Nossa equipe está disponível 24/7 via Discord oficial. Para questões urgentes (compras, banimentos, perda de itens), prefira o canal direto.</p>
            <Div className="grid gap-3 sm:grid-cols-3">
              <a href="https://discord.gg" target="_blank" rel="noreferrer" className="rounded-sm border border-amber-900/30 bg-amber-50/60 p-3 text-center hover:bg-amber-100 transition">
                <DiscordIcon className="h-6 w-6 mx-auto text-[#5865F2]" />
                <Div className="font-bold mt-1">Discord</Div>
                <Div className="text-xs">Resposta em minutos</Div>
              </a>
              <a href="mailto:suporte@zivduel.com" className="rounded-sm border border-amber-900/30 bg-amber-50/60 p-3 text-center hover:bg-amber-100 transition">
                <Mail className="h-6 w-6 mx-auto" />
                <Div className="font-bold mt-1">Email</Div>
                <Div className="text-xs">suporte@zivduel.com</Div>
              </a>
              <Div className="rounded-sm border border-amber-900/30 bg-amber-50/60 p-3 text-center">
                <ShieldAlert className="h-6 w-6 mx-auto" />
                <Div className="font-bold mt-1">Segurança</Div>
                <Div className="text-xs">abuso@zivduel.com</Div>
              </Div>
            </Div>
          </Div>
        </GoldFrame>

        <GoldFrame>
          <PanelTitle icon={<MessageCircle className="h-3.5 w-3.5" />}>Perguntas Frequentes</PanelTitle>
          <Div className="mmo-parchment p-6 space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="rounded-sm border border-amber-900/30 bg-amber-50/50 p-3">
                <summary className="cursor-pointer font-bold">{f.q}</summary>
                <p className="text-sm mt-2">{f.a}</p>
              </details>
            ))}
          </Div>
        </GoldFrame>

        <GoldFrame>
          <PanelTitle>Abrir Ticket</PanelTitle>
          <Div className="mmo-parchment p-6">
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); alert("Ticket enviado! Responderemos em breve."); }}>
              <input required className="rounded-sm border border-amber-900/40 bg-white px-3 py-2 text-sm" placeholder="Seu email" type="email" />
              <input required className="rounded-sm border border-amber-900/40 bg-white px-3 py-2 text-sm" placeholder="Assunto" />
              <textarea required rows={5} className="rounded-sm border border-amber-900/40 bg-white px-3 py-2 text-sm" placeholder="Descreva sua questão" />
              <button type="submit" className="mmo-btn-gold rounded-sm py-2.5 text-xs">Enviar Ticket</button>
            </form>
          </Div>
        </GoldFrame>
      </section>
    </SiteShell>
  );
}
