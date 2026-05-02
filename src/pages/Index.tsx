import MMOLanding from "@/components/MMOLanding";

const Index = () => {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <div id="main">
        <MMOLanding />
      </div>
    </>
  );
};

export default Index;
