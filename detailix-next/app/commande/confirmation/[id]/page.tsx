import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { id } = await params;
  const { fresh } = await searchParams;
  const session = await getSession();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) notFound();

  // Security: only the order owner (or guest orders with no userId) can view
  if (order.userId && order.userId !== session?.userId) notFound();

  return (
    <div className="page-enter container" style={{ paddingTop: "var(--space-2xl)", paddingBottom: "var(--space-3xl)", maxWidth: 640 }}>
      {fresh === "1" && <ClearCart />}
      <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>✅</div>
        <h1 style={{ marginBottom: "var(--space-sm)" }}>Commande confirmée !</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Référence : <strong style={{ color: "var(--text)", fontFamily: "monospace" }}>{order.id}</strong>
        </p>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)", border: "1px solid var(--border)", marginBottom: "var(--space-xl)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-lg)" }}>Détail de la commande</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
              <span style={{ color: "var(--text-muted)" }}>
                {item.product.name} × {item.qty}
              </span>
              <span style={{ fontWeight: 600 }}>
                {(item.unitPrice * item.qty).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-sm)", marginTop: "var(--space-sm)", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Total TTC</span>
            <span style={{ color: "var(--accent)" }}>
              {order.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
        {session && (
          <Link href="/compte" className="btn btn-ghost">Mes commandes</Link>
        )}
        <Link href="/" className="btn btn-primary">Continuer mes achats</Link>
      </div>
    </div>
  );
}
