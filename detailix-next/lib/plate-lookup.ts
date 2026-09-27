/**
 * Simulateur de recherche par plaque d'immatriculation française (format SIV).
 *
 * Ceci n'est PAS un accès au fichier SIV officiel : aucune API gouvernementale
 * ou tierce payante n'est appelée. Il s'agit d'une table de correspondance
 * locale et déterministe, à des fins de démonstration uniquement.
 */

const PLATE_FORMAT = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/i;

export function isValidPlateFormat(plaque: string): boolean {
  return PLATE_FORMAT.test(plaque.trim());
}

function normalize(plaque: string): string {
  return plaque.trim().toUpperCase();
}

/** Table de correspondance fictive plaque -> codeMoteur (data/vehicles.json). */
const PLATE_TABLE: Record<string, string> = {
  "AA-123-AA": "DLAA", // Volkswagen Golf 8 — 2.0 TSI GTI 245
  "BC-456-BD": "CJXB", // Volkswagen Golf 7 — 2.0 TSI R 300
  "CD-789-EF": "DNUE", // Audi S3 (8Y) — 2.0 TFSI 310
  "DE-012-FG": "DNUA", // Audi RS3 (8Y) — 2.5 TFSI 400
  "EF-345-GH": "B47D20B", // BMW Série 3 (G20) — 320d 190
  "FG-678-HJ": "S58B30B", // BMW M2 (G87) — S58 460
  "GH-901-JK": "M139L", // Mercedes-Benz C 63 AMG (W206) — 476
  "HJ-234-KL": "M260", // Mercedes-Benz A 35 AMG (W177) — 306
  "JK-567-LM": "M5MT-300", // Renault Mégane 4 RS — 1.8 TCe RS Trophy 300
  "KL-890-MN": "H5Ht", // Renault Alpine A110 — 1.8 Turbo S 252
  "LM-123-NP": "M2DA", // Ford Focus RS Mk3 — 2.3 EcoBoost 350
  "MN-456-PQ": "K20C1-FL5", // Honda Civic Type R (FL5) — 2.0 VTEC Turbo 330
  "NP-789-QR": "G16E-GTS", // Toyota GR Yaris — 1.6 Turbo 261
  "PQ-012-RS": "EJ257", // Subaru WRX STI — 2.5 Turbo 300
  "QR-345-ST": "HNZ", // Peugeot 308 III — 1.2 PureTech 130
  "RS-678-TU": "EP6CDTX", // Peugeot 208 GTi — 1.6 THP 208
  "ST-901-UV": "CJXC", // Cupra Ateca — 2.0 TSI 300
  "TU-234-VW": "VR38DETT", // Nissan GT-R (R35) — 3.8 V6 Biturbo 570
  "UV-567-WX": "9A2-GT3", // Porsche 911 (992) — GT3 4.0 NA 510
  "VW-890-XY": "4B11", // Mitsubishi Lancer Evo X — 2.0 Turbo 295
};

/** Renvoie le codeMoteur simulé pour une plaque connue de la table de démo, sinon null. */
export function lookupPlate(plaque: string): string | null {
  const key = normalize(plaque);
  if (!isValidPlateFormat(key)) return null;
  return PLATE_TABLE[key] ?? null;
}
