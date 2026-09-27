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
  "AB-111-AC": "DFHA", // Volkswagen Golf 7 — 2.0 TDI 150
  "AD-114-AE": "CHHC", // Volkswagen Golf 7 — 2.0 TSI GTI Clubsport 265
  "AF-117-AG": "DNFA", // Volkswagen Golf 8 — 2.0 TSI R 320
  "AH-120-AJ": "CUSA", // Volkswagen Polo 5 (6R/6C) — 1.4 TDI 90
  "AK-123-AL": "CBDC", // Volkswagen Golf 6 — 2.0 TDI 140
  "AM-126-AN": "BUB", // Volkswagen Golf 5 — 3.2 V6 R32 250
  "AP-129-AQ": "DPCC", // Audi A3 (8Y) — 35 TFSI 150
  "AR-132-AS": "CJXG", // Audi S3 (8V) — 2.0 TFSI 300
  "AT-135-AU": "DECA", // Audi RS4 (B9) — 2.9 TFSI 450
  "AV-138-AW": "CAGB", // Audi A4 (B8) — 2.0 TDI 143
  "AX-141-AY": "CFFB", // Audi Q3 (8U) — 2.0 TDI 150
  "AZ-144-BA": "CAHA", // Audi A5 (8T) — 2.0 TDI 177
  "BB-147-BD": "B58B30M0", // BMW Série 3 (G20) — M340i 374
  "BE-150-BF": "S65B40", // BMW Série 3 Coupé (E92) — M3 4.0 V8 420
  "BG-153-BH": "S58B30O2", // BMW M4 (G82) — S58 480
  "BJ-156-BK": "S58B30M1", // BMW X3 M (F97) — Competition 510
  "BL-159-BM": "M133", // Mercedes-Benz A 45 AMG (W176) — A 45 AMG 381
  "BN-162-BP": "M139-GLA", // Mercedes-Benz GLA 45 AMG (H247) — GLA 45 S AMG 421
  "BQ-165-BR": "M5MT", // Renault Mégane 4 RS — 1.8 TCe 280
  "BS-168-BT": "H5H-C5", // Renault Clio 5 TCe — TCe 130
  "BU-171-BV": "H5Ht-S", // Renault Alpine A110 — 1.8 Turbo S 292
  "BW-174-BX": "H4Bt400-GT", // Renault Twingo 3 GT — 0.9 TCe GT 110
  "BY-177-BZ": "SFJA", // Ford Fiesta ST Mk7 — 1.5 EcoBoost 200
  "CA-180-CB": "M2GB", // Ford Mustang (S550) — 2.3 EcoBoost 290
  "CC-183-CE": "K20C1", // Honda Civic Type R (FK8) — 2.0 VTEC Turbo 320
  "CF-186-CG": "K20A", // Honda Integra Type R (DC5) — 2.0 VTEC 220
  "CH-189-CJ": "H22A7", // Honda Accord Type R (CL1) — 2.2 VTEC H22A 220
  "CK-192-CL": "B58B30M1", // Toyota GR Supra (A90) — 3.0 Turbo 340
  "CM-195-CN": "M15A-FXE", // Toyota Yaris (XP210) — 1.5 Hybrid 116
  "CP-198-CQ": "FA20-BRZ", // Subaru BRZ (ZC6) — 2.0 NA 200
  "CR-201-CS": "YHZ", // Peugeot 308 III — 1.5 BlueHDi 130
  "CT-204-CU": "XU5JA", // Peugeot 205 GTI — 1.6 GTI 115
  "CV-207-CW": "DNFC-VZ", // Cupra Formentor VZ — 2.0 TSI VZ 310
  "CX-210-CY": "4G63T-VI", // Mitsubishi Lancer Evo VI — 2.0 Turbo 4G63T 280
  "CZ-213-DA": "MA1.75", // Porsche Cayman S (981) — 3.4 NA 325
  "DB-216-DC": "9AA", // Porsche Macan — S 3.0 V6 Biturbo 354
  "DD-219-DF": "VQ37VHR", // Nissan 370Z (Z34) — 3.7 V6 328
  "DG-222-DH": "Z20LEH", // Opel Astra J OPC — 2.0 Turbo 280
  "DJ-225-DK": "CHHC-OCT", // Skoda Octavia III RS — 2.0 TSI RS 230
  "DL-228-DM": "690T", // Alfa Romeo Giulia Quadrifoglio — 2.9 V6 Biturbo 510
  "DN-231-DP": "312A3000-595", // Fiat 500 Abarth — 1.4 T-Jet 595 145
  "DQ-234-DR": "G4KH", // Hyundai i30 N — 2.0 T-GDi N 250
  "DS-237-DT": "G6DH", // Kia Stinger GT — 3.3 T-GDi V6 370
  "DU-240-DV": "B4204T39", // Volvo V60 Polestar — 2.0 T6 Polestar 367
  "DW-243-DX": "B48A20O1", // Mini John Cooper Works (F56) — 2.0 Turbo 231
  "DY-246-DZ": "AJ133", // Jaguar F-Type R — 5.0 V8 Compresseur 575
  "EA-249-EB": "AJ300P", // Land Rover Defender P400 — 3.0 I6 Turbo MHEV 400
  "EC-252-ED": "H5H-DUS", // Dacia Duster II — TCe 130 4x2
};

/** Renvoie le codeMoteur simulé pour une plaque connue de la table de démo, sinon null. */
export function lookupPlate(plaque: string): string | null {
  const key = normalize(plaque);
  if (!isValidPlateFormat(key)) return null;
  return PLATE_TABLE[key] ?? null;
}
