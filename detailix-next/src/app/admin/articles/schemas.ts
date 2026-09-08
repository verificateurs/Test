import { z } from "zod";

export const ArticleFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(150),
  excerpt: z.string().trim().min(1, "Résumé requis").max(300),
  content: z.string().trim().min(1, "Contenu requis").max(20000),
});

export type ArticleFormValues = z.infer<typeof ArticleFormSchema>;
