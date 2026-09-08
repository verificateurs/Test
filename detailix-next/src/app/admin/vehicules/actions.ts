"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateCatalogue } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slug";

export type VehicleActionState = { error: string | null };

const NameSchema = z.object({ name: z.string().trim().min(1, "Nom requis").max(120) });
const MotorSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis").max(120),
  codeMoteur: z.string().trim().min(1, "Code moteur requis").max(40),
});

export async function createMakeAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  await requireAdmin();
  const parsed = NameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const id = slugify(parsed.data.name);
  if (!id) return { error: "Nom invalide." };
  if (await prisma.vehicleMake.findUnique({ where: { id } })) return { error: `"${id}" existe déjà.` };

  await prisma.vehicleMake.create({ data: { id, name: parsed.data.name } });
  revalidateCatalogue();
  redirect("/admin/vehicules");
}

export async function deleteMakeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.vehicleMake.delete({ where: { id } }).catch(() => {});
  revalidateCatalogue();
  redirect("/admin/vehicules");
}

export async function createModelAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  await requireAdmin();
  const makeId = String(formData.get("makeId") ?? "");
  const make = await prisma.vehicleMake.findUnique({ where: { id: makeId } });
  if (!make) return { error: "Marque véhicule introuvable." };

  const parsed = NameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const id = slugify(`${make.id}-${parsed.data.name}`);
  if (!id) return { error: "Nom invalide." };
  if (await prisma.vehicleModel.findUnique({ where: { id } })) return { error: `"${id}" existe déjà.` };

  await prisma.vehicleModel.create({ data: { id, name: parsed.data.name, makeId } });
  revalidateCatalogue();
  redirect("/admin/vehicules");
}

export async function deleteModelAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.vehicleModel.delete({ where: { id } }).catch(() => {});
  revalidateCatalogue();
  redirect("/admin/vehicules");
}

export async function createMotorisationAction(_prev: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  await requireAdmin();
  const modelId = String(formData.get("modelId") ?? "");
  const model = await prisma.vehicleModel.findUnique({ where: { id: modelId } });
  if (!model) return { error: "Modèle introuvable." };

  const parsed = MotorSchema.safeParse({ label: formData.get("label"), codeMoteur: formData.get("codeMoteur") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const id = slugify(`${model.id}-${parsed.data.codeMoteur}`);
  if (!id) return { error: "Données invalides." };
  if (await prisma.vehicleMotorisation.findUnique({ where: { id } })) return { error: `"${id}" existe déjà.` };

  await prisma.vehicleMotorisation.create({ data: { id, label: parsed.data.label, codeMoteur: parsed.data.codeMoteur, modelId } });
  revalidateCatalogue();
  redirect("/admin/vehicules");
}

export async function deleteMotorisationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.vehicleMotorisation.delete({ where: { id } }).catch(() => {});
  revalidateCatalogue();
  redirect("/admin/vehicules");
}
