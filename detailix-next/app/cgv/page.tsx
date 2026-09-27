import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente de Detailix : commande, prix, livraison, rétractation et garanties.",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <div className="container legal-page">
      <h1>Conditions générales de vente</h1>

      <section>
        <h2>Commande</h2>
        <p>
          [À COMPLÉTER : modalités de passation, de confirmation et d&apos;annulation d&apos;une commande]
        </p>
      </section>

      <section>
        <h2>Prix</h2>
        <p>
          Les prix affichés sur le site sont exprimés en euros, toutes taxes comprises (TTC).
          [À COMPLÉTER : conditions de révision des prix et frais additionnels éventuels]
        </p>
      </section>

      <section>
        <h2>Livraison</h2>
        <p>
          [À COMPLÉTER : zones de livraison couvertes, délais et frais de port applicables]
        </p>
      </section>

      <section>
        <h2>Droit de rétractation</h2>
        <p>
          Conformément aux dispositions légales applicables à la vente à distance, le client dispose d&apos;un
          délai de rétractation. [À COMPLÉTER : durée exacte, modalités d&apos;exercice et exceptions applicables]
        </p>
      </section>

      <section>
        <h2>Garanties</h2>
        <p>
          [À COMPLÉTER : garanties légales (conformité, vices cachés) et garanties commerciales applicables
          aux produits vendus]
        </p>
      </section>
    </div>
  );
}
