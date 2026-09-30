import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidPlateFormat, plateToVehicleId } from "@/lib/plate-lookup";
import { getEngineCompatibleProducts } from "@/lib/engine-products";
import { checkRateLimit } from "@/lib/rate-limit";

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

export async function GET(request: Request, { params }: { params: Promise<{ plaque: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };

  // Endpoint public, sans authentification : protégé par IP uniquement, comme
  // lib/rate-limit.ts le documente (x-forwarded-for n'est fiable que derrière
  // un proxy de confiance qui le réécrit).
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`immatriculation:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de recherches. Réessayez dans 1 minute." },
      { status: 429, headers }
    );
  }

  const { plaque } = await params;

  if (!isValidPlateFormat(plaque)) {
    return NextResponse.json(
      { error: "Format de plaque invalide. Format attendu : AA-123-AA (SIV) ou 1234 AB 56 (FNI)." },
      { status: 400, headers }
    );
  }

  // Catalogue déterministe : la même plaque (normalisée) pointe toujours vers le même
  // véhicule, mais l'association est arbitraire — ce n'est pas une vraie recherche SIV.
  const ids = await db.vehicle.findMany({ select: { id: true } });
  const vehicleId = plateToVehicleId(plaque, ids.map((v) => v.id));
  if (vehicleId === null) {
    return NextResponse.json(
      { error: "Aucun véhicule dans le catalogue pour résoudre cette plaque." },
      { status: 404, headers }
    );
  }

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
