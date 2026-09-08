/** Identifiants lisibles type "303-aerospace-protectant", cohérents avec le
 * catalogue seedé depuis le prototype vanilla. Utilisé par le panel admin
 * pour dériver un id à la création (jamais modifiable ensuite, car il sert
 * de clé primaire référencée par des URLs déjà indexées). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
