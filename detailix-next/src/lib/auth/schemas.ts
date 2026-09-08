import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(10, "10 caractères minimum"),
  displayName: z.string().trim().min(1, "Nom requis").max(80, "Nom trop long"),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
