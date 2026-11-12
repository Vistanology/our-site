import type { Metadata } from "next";
import "./globals.css";
import RouteTransition from "@/components/route-transition";

export const metadata: Metadata = {
  title: "Vistanology — Sonhe. Explore. Evolua.",
  description: "Um universo criativo entre tecnologia, natureza e nostalgia. Explore experiências, conheça nossos projetos e dê vida à sua próxima ideia de software.",
  applicationName: "Vistanology",
  openGraph: {
    title: "Vistanology — O futuro que nos prometeram",
    description: "Parece que eu voltei pra casa. Um universo digital inspirado em um futuro mais bonito.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<RouteTransition /></body></html>;
}
