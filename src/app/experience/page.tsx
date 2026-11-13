import type { Metadata } from "next";
import ExperiencePage from "@/components/experience/experience-page";

export const metadata: Metadata = {
  title: "Vistanology Experience — Ideas become experiences",
  description:
    "Um showroom digital da Vistanology: explore possibilidades, acompanhe experiências em desenvolvimento e descubra o que podemos construir juntos.",
  openGraph: {
    title: "Vistanology Experience — Ideas become experiences",
    description: "Ideias que merecem ser experimentadas. Explore, experimente, descubra e construa.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function ExperienceRoute() {
  return <ExperiencePage />;
}
