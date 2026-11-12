export const site = {
  name: "Vistanology",
  github: "https://github.com/Nuwget",
  requestEndpoint: process.env.NEXT_PUBLIC_REQUEST_ENDPOINT?.trim() ?? "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ?? "",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim() ?? "",
  contactName: "César Rodrigues",
  whatsappDisplay: "+55 (13) 99604-3320",
  whatsappNumber: "5513996043320",
};

export function whatsappUrl(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const softwareCategories = ["Todos", "Desktop", "Web", "Produtividade", "Criatividade", "Desenvolvimento"] as const;

export interface SoftwareProduct {
  id: string;
  name: string;
  description: string;
  category: Exclude<(typeof softwareCategories)[number], "Todos">;
  platforms: string[];
  version: string;
  requirements: string;
  license: string;
  availability: "available" | "development";
  price?: string;
  image?: string;
  documentationUrl?: string;
  downloadUrl?: string;
  checkoutUrl?: string;
}

export const products: SoftwareProduct[] = [];
