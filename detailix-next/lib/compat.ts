import type { JsonValue } from "@prisma/client/runtime/library";

type CompatData =
  | { type: "universel" }
  | { type: "codesMoteurs"; codes: string[] };

export function parseCompatCodes(raw: JsonValue): string[] | "universel" | undefined {
  if (!raw) return undefined;
  try {
    const c = (typeof raw === "string" ? JSON.parse(raw) : raw) as CompatData;
    if (c.type === "universel") return "universel";
    if (c.type === "codesMoteurs" && Array.isArray(c.codes)) return c.codes;
  } catch {}
  return undefined;
}
