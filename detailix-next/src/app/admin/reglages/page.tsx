import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Réglages", robots: { index: false } };

export default async function ReglagesPage() {
  const settings = await prisma.setting.findMany({ where: { key: { in: ["marginPercent", "freeShippingThreshold"] } } });
  const marginPercent = Number(settings.find((s) => s.key === "marginPercent")?.value ?? 0);
  const freeShippingThreshold = Number(settings.find((s) => s.key === "freeShippingThreshold")?.value ?? 79);

  return (
    <div>
      <h1>Réglages</h1>
      <div className="admin-card">
        <SettingsForm marginPercent={marginPercent} freeShippingThreshold={freeShippingThreshold} />
      </div>
    </div>
  );
}
