import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-3 pb-10">
        <GoldFrame>
          <PanelTitle icon={<ScrollText className="h-3.5 w-3.5" />}>Termos de Uso</PanelTitle>
          <Div className="mmo-parchment p-6 space-y-4 text-sm leading-relaxed">
            <h1 className="text-2xl font-bold">Termos e Condições — Ziv Duel</h1>
            <p className="italic">Última atualização: 03 de maio de 2026</p>

            <h2 className="text-lg font-bold">1. Aceitação</h2>
            <p>Ao criar uma conta e utilizar o Ziv Duel, você concorda com estes Termos. Caso não concorde, não utilize o serviço.</p>

            <h2 className="text-lg font-bold">2. Conta</h2>
            <p>Você é responsável pela segurança de sua conta. Não compartilhe credenciais. Contas comprometidas podem ser suspensas para proteção.</p>

            <h2 className="text-lg font-bold">3. Conduta</h2>
            <p>É proibido: uso de cheats/hacks, exploits, assédio, discurso de ódio, comércio de itens fora dos canais oficiais, e múltiplas contas para vantagem indevida.</p>

            <h2 className="text-lg font-bold">4. Cupons e Compras</h2>
            <p>Cupons são moeda virtual sem valor monetário fora do jogo. Compras são finais, salvo casos previstos no CDC. O Bazar de Personagens utiliza Cupons como moeda exclusiva de transação.</p>

            <h2 className="text-lg font-bold">5. Bazar de Personagens</h2>
            <p>Personagens listados pelo jogador podem ser vendidos por outro usuário mediante pagamento em Cupons. A transferência é definitiva e irreversível.</p>

            <h2 className="text-lg font-bold">6. Privacidade</h2>
            <p>Coletamos apenas dados necessários para operação do serviço. Consulte nossa Política de Privacidade para detalhes.</p>

            <h2 className="text-lg font-bold">7. Banimentos</h2>
            <p>Violações podem resultar em advertência, suspensão temporária ou banimento permanente. Recursos podem ser feitos via Suporte.</p>

            <h2 className="text-lg font-bold">8. Modificações</h2>
            <p>Podemos atualizar estes termos. Mudanças significativas serão comunicadas via Discord e email cadastrado.</p>

            <h2 className="text-lg font-bold">9. Contato</h2>
            <p>Dúvidas: suporte@zivduel.com</p>
          </Div>
        </GoldFrame>
      </section>
    </SiteShell>
  );
}
