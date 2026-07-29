import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Studio } from "@/components/studio";

export const metadata: Metadata = {
  title: "Estudio de permisos",
  description:
    "Importa un backup de LuckPerms, inspecciona herencias y construye plantillas de permisos de forma local.",
  alternates: { canonical: "/studio" },
};

export default function StudioPage() {
  return (
    <ViewTransition
      enter={{
        "hiera-forward": "hiera-forward",
        "hiera-back": "hiera-back",
        default: "none",
      }}
      exit={{
        "hiera-forward": "hiera-forward",
        "hiera-back": "hiera-back",
        default: "none",
      }}
      default="none"
    >
      <Studio />
    </ViewTransition>
  );
}
