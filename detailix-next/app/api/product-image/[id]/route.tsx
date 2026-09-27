import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const dynamic = "force-static";

const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 600;

interface CategoryVisual {
  from: string;
  to: string;
  icon: React.ReactElement;
}

function WheelIcon() {
  return (
    <svg width="230" height="230" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="3" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" />
      <path
        d="M12 2.5V9M12 15V21.5M2.5 12H9M15 12H21.5M5.1 5.1L9.5 9.5M14.5 14.5L18.9 18.9M18.9 5.1L14.5 9.5M9.5 14.5L5.1 18.9"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ExhaustIcon() {
  return (
    <svg width="260" height="150" viewBox="0 0 100 60" fill="none">
      <rect x="4" y="16" width="58" height="28" rx="14" fill="white" fillOpacity="0.9" />
      <ellipse cx="80" cy="30" rx="16" ry="19" fill="white" fillOpacity="0.9" />
      <ellipse cx="80" cy="30" rx="8.5" ry="10.5" fill="black" fillOpacity="0.45" />
    </svg>
  );
}

function HeadlightIcon() {
  return (
    <svg width="190" height="230" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21h6M10 19h4M12 2a7 7 0 0 0-4 12.9c.6.5 1 1.2 1 2.1h6c0-.9.4-1.6 1-2.1A7 7 0 0 0 12 2Z"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="1.4"
        fill="white"
        fillOpacity="0.2"
      />
    </svg>
  );
}

function CarSilhouetteIcon() {
  return (
    <svg width="280" height="150" viewBox="0 0 100 50" fill="none">
      <path
        d="M10 35 Q15 15 35 15 L65 15 Q80 15 88 35 L92 35 Q94 35 94 38 L94 42 Q94 44 92 44 L84 44 Q82 38 76 38 Q70 38 68 44 L32 44 Q30 38 24 38 Q18 38 16 44 L8 44 Q6 44 6 42 L6 38 Q6 35 10 35 Z"
        fill="white"
        fillOpacity="0.88"
      />
      <circle cx="24" cy="44" r="6" fill="black" fillOpacity="0.45" />
      <circle cx="76" cy="44" r="6" fill="black" fillOpacity="0.45" />
    </svg>
  );
}

function SparkleDropIcon() {
  return (
    <svg width="190" height="230" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 6 10 6 15a6 6 0 0 0 12 0C18 10 12 2 12 2Z" fill="white" fillOpacity="0.88" />
      <path d="M19 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg width="180" height="230" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 12 5 16.5A7 7 0 0 0 19 16.5C19 12 12 3 12 3Z" fill="white" fillOpacity="0.88" />
      <circle cx="9.3" cy="15" r="1.7" fill="white" fillOpacity="0.65" />
    </svg>
  );
}

function FilmRollIcon() {
  return (
    <svg width="230" height="230" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.2" fill="white" fillOpacity="0.88" />
      <circle cx="12" cy="12" r="3.3" fill="black" fillOpacity="0.4" />
      <path d="M12 2.8A9.2 9.2 0 0 1 21.2 12" stroke="black" strokeOpacity="0.25" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function EngineWrenchIcon() {
  return (
    <svg width="230" height="230" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function ToolboxIcon() {
  return (
    <svg width="250" height="190" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="9" width="18" height="11" rx="2" fill="white" fillOpacity="0.88" />
      <path d="M8 9V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" fill="none" />
      <rect x="2" y="12.5" width="20" height="3" fill="black" fillOpacity="0.3" />
    </svg>
  );
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  "cosmetique-carrosserie": { from: "#12283f", to: "#4fc3f7", icon: <DropletIcon /> },
  "polish-protection-ceramique": { from: "#3a0d5c", to: "#ff4fa3", icon: <SparkleDropIcon /> },
  "jantes-pneus": { from: "#1e2123", to: "#9aa7b0", icon: <WheelIcon /> },
  "kits-carrosserie": { from: "#1a0e10", to: "#ff1e2d", icon: <CarSilhouetteIcon /> },
  "eclairage": { from: "#2b2200", to: "#ffd400", icon: <HeadlightIcon /> },
  "echappement-sport": { from: "#1c1a18", to: "#ff7a1a", icon: <ExhaustIcon /> },
  "covering-vitres-teintees": { from: "#0c2027", to: "#22d3ee", icon: <FilmRollIcon /> },
  "preparation-moteur": { from: "#07260f", to: "#7cff2e", icon: <EngineWrenchIcon /> },
  "outils-detailing": { from: "#0d1b2a", to: "#f4a300", icon: <ToolboxIcon /> },
};

const FALLBACK_VISUAL: CategoryVisual = { from: "#18181c", to: "#3a3a42", icon: <ToolboxIcon /> };

function fontSizeForName(name: string): number {
  if (name.length > 45) return 24;
  if (name.length > 30) return 28;
  return 34;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: { brand: { select: { name: true } } },
  });

  if (!product) {
    return new Response("Produit introuvable", { status: 404 });
  }

  const visual = CATEGORY_VISUALS[product.categoryId] ?? FALLBACK_VISUAL;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.3,
          }}
        >
          {visual.icon}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "48px 44px",
            background: "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            {product.brand.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: fontSizeForName(product.name),
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </div>
        </div>
      </div>
    ),
    {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
