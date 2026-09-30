import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidPlateFormat, plateToVehicleIndex } from "@/lib/plate-lookup";
import { getEngineCompatibleProducts } from "@/lib/engine-products";

export const dynamic = "force-dynamic";

export interface ImmatriculationVehicle {
  id: string;
  codeMoteur: string;
  platform: string | null;
  marque: string;
  modele: string;
  motorisation: string;
  anneeDebut: number | null;
  anneeFin: number | null;
  carburant: string | null;
  cylindreeCm3: number | null;
  puissanceOrigineCh: number | null;
  coupleOrigineNm: number | null;
  consoOrigineL100: number | null;
}

export interface ImmatriculationStagePack {
  id: string;
  stage: number;
  label: string;
  description: string;
  gainChMin: number;
  gainChMax: number;
  gainNmMin: number;
  gainNmMax: number;
  consoDeltaL100: number;
  prixIndicatif: number;
  homologation: string;
  includedProductIds: string[];
}

export interface ImmatriculationResponse {
  vehicle: ImmatriculationVehicle;
  produitsMoteur: Awaited<ReturnType<typeof getEngineCompatibleProducts>>;
  stagePacks: ImmatriculationStagePack[];
}

function parseIncludedProductIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ plaque: string }> }) {
  const { plaque } = await params;
  const headers = { "Cache-Control": "private, no-store" };

  if (!isValidPlateFormat(plaque)) {
    return NextResponse.json(
      { error: "Format de plaque invalide. Format attendu : AA-123-AA." },
      { status: 400, headers }
    );
  }

  // Catalogue déterministe : la même plaque (normalisée) pointe toujours vers le même
  // véhicule, mais l'association est arbitraire — ce n'est pas une vraie recherche SIV.
  // `id` (asc) donne un ordre stable indépendant de l'ordre d'insertion en base.
  const ids = await db.vehicle.findMany({ select: { id: true }, orderBy: { id: "asc" } });
  const index = plateToVehicleIndex(plaque, ids.length);
  if (index === null) {
    return NextResponse.json(
      { error: "Aucun véhicule dans le catalogue pour résoudre cette plaque." },
      { status: 404, headers }
    );
  }
  const vehicleId = ids[index].id;

  const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return NextResponse.json(
      { error: "Motorisation résolue mais absente du catalogue véhicules." },
      { status: 404, headers }
    );
  }
  const codeMoteur = vehicle.codeMoteur;

  const [produitsMoteur, stagePacks] = await Promise.all([
    getEngineCompatibleProducts(codeMoteur),
    db.stagePack.findMany({ where: { codeMoteur }, orderBy: { stage: "asc" } }),
  ]);

  const response: ImmatriculationResponse = {
    vehicle: {
      id: vehicle.id,
      codeMoteur: vehicle.codeMoteur,
      platform: vehicle.platform,
      marque: vehicle.marque,
      modele: vehicle.modele,
      motorisation: vehicle.motorisation,
      anneeDebut: vehicle.anneeDebut,
      anneeFin: vehicle.anneeFin,
      carburant: vehicle.carburant,
      cylindreeCm3: vehicle.cylindreeCm3,
      puissanceOrigineCh: vehicle.puissanceOrigineCh,
      coupleOrigineNm: vehicle.coupleOrigineNm,
      consoOrigineL100: vehicle.consoOrigineL100,
    },
    produitsMoteur,
    stagePacks: stagePacks.map((s) => ({
      id: s.id,
      stage: s.stage,
      label: s.label,
      description: s.description,
      gainChMin: s.gainChMin,
      gainChMax: s.gainChMax,
      gainNmMin: s.gainNmMin,
      gainNmMax: s.gainNmMax,
      consoDeltaL100: s.consoDeltaL100,
      prixIndicatif: s.prixIndicatif,
      homologation: s.homologation,
      includedProductIds: parseIncludedProductIds(s.includedProductIds),
    })),
  };

  return NextResponse.json(response, { headers });
}
