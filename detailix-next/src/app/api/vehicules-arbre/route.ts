import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-static";

/**
 * Arbre marque > modèle > motorisation, consommé par le sélecteur "mon
 * garage" (île client, sur des pages statiques) — un composant client ne
 * peut pas interroger Prisma directement. Route force-static comme le reste
 * du catalogue : revalidée par revalidateCatalogue() sur toute écriture
 * admin de véhicule, pour ne jamais rester périmée entre deux builds.
 */
export async function GET() {
  const makes = await prisma.vehicleMake.findMany({
    orderBy: { name: "asc" },
    include: {
      models: {
        orderBy: { name: "asc" },
        include: { motorisations: { orderBy: { label: "asc" } } },
      },
    },
  });

  return NextResponse.json({
    makes: makes.map((make) => ({
      id: make.id,
      name: make.name,
      models: make.models.map((model) => ({
        id: model.id,
        name: model.name,
        motorisations: model.motorisations.map((m) => ({ id: m.id, label: m.label, codeMoteur: m.codeMoteur })),
      })),
    })),
  });
}
