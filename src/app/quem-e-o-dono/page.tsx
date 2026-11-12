import type { Metadata } from "next";
import OwnerPage from "@/components/owner-page";

export const metadata: Metadata = {
  title: "Quem é o dono? — VISTA / Vistanology",
  description:
    "Por trás da Vista está César Rodrigues Ribeiro (Dudu), Desenvolvedor Full Stack de Praia Grande (SP). Stack, experiência, formação e certificados reais.",
  openGraph: {
    title: "Quem é o dono? — VISTA / Vistanology",
    description: "Conheça o desenvolvedor por trás da Vista: trajetória, stack, experiência e certificados.",
    locale: "pt_BR",
    type: "profile",
  },
};

export default function OwnerRoute() {
  return <OwnerPage />;
}
