import type { Metadata } from "next";
import InvitationExperience from "@/components/invitation-experience";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Você foi convidado — VISTA / Vistanology",
  description: "Uma experiência começa quando uma ideia encontra as pessoas certas. Converse com a Vista sobre sites, sistemas e soluções digitais sob medida.",
  openGraph: {
    title: "Você foi convidado — VISTA / Vistanology",
    description: "Ideias que ganham outra dimensão. Seu convite para criar algo que tenha sentido.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function InvitationPage() {
  return <InvitationExperience endpoint={process.env.NEXT_PUBLIC_INVITATION_ENDPOINT?.trim() ?? ""} contactEmail={site.contactEmail} />;
}
