import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-static";

export interface VehiculeTree {
  marques: {
    label: string;
    modeles: {
      label: string;
      motorisations: { codeMoteur: string; label: string }[];
    }[];
  }[];
}

export async function GET() {
  const vehicles = await db.vehicle.findMany({ orderBy: [{ marque: "asc" }, { modele: "asc" }, { motorisation: "asc" }] });

  const tree: VehiculeTree = { marques: [] };
  const marqueMap = new Map<string, Map<string, { codeMoteur: string; label: string }[]>>();

  for (const v of vehicles) {
    if (!marqueMap.has(v.marque)) marqueMap.set(v.marque, new Map());
    const modeles = marqueMap.get(v.marque)!;
    if (!modeles.has(v.modele)) modeles.set(v.modele, []);
    modeles.get(v.modele)!.push({ codeMoteur: v.codeMoteur, label: v.motorisation });
  }

  for (const [marque, modeles] of marqueMap) {
    tree.marques.push({
      label: marque,
      modeles: Array.from(modeles.entries()).map(([modele, motorisations]) => ({
        label: modele,
        motorisations,
      })),
    });
  }

  return NextResponse.json(tree, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
