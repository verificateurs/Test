import { readFileSync } from "fs";
import { join } from "path";

let _margin: number | null = null;

function getMargin(): number {
  if (_margin !== null) return _margin;
  try {
    const cfg = JSON.parse(
      readFileSync(join(process.cwd(), "../data/pricing-config.json"), "utf8")
    );
    _margin = cfg.marginPercent ?? 30;
  } catch {
    _margin = 30;
  }
  return _margin!;
}

export function computePrice(prixAchat: number): number {
  return Math.round(prixAchat * (1 + getMargin() / 100) * 100) / 100;
}

/** Inverse of computePrice: converts a displayed sale price back to a prixAchat bound. */
export function computePrixAchatFromPrice(price: number): number {
  return price / (1 + getMargin() / 100);
}
