import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  q: z.string().min(2).max(80).trim(),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({ q: req.nextUrl.searchParams.get("q") });
  if (!parsed.success) {
    return NextResponse.json([], { status: 200 });
  }
  const q = parsed.data.q;

  const [products, brands] = await Promise.all([
    db.product.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, categoryId: true },
      take: 5,
    }),
    db.brand.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  const results = [
    ...products.map((p) => ({ type: "product" as const, id: p.id, name: p.name, categoryId: p.categoryId })),
    ...brands.map((b) => ({ type: "brand" as const, id: b.id, name: b.name })),
  ];

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
