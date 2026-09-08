/**
 * Injecte un bloc JSON-LD. La sérialisation échappe `<` pour empêcher toute
 * fermeture prématurée de la balise script (seul vecteur d'injection possible
 * ici, le JSON-LD n'étant pas du JS exécutable au sens de la CSP).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
