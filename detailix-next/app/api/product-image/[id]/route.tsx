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

// ─── Icônes génériques par catégorie (fallback si aucun mot-clé de produit
// ne matche, voir ICON_RULES plus bas) ─────────────────────────────────────

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

// ─── Icônes de TYPE de produit (choisies via mot-clé dans product.name,
// voir ICON_RULES) ──────────────────────────────────────────────────────────

function EcuChipIcon() {
  return (
    <svg width="210" height="210" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="white" fillOpacity="0.88" />
      <rect x="9" y="9" width="6" height="6" fill="black" fillOpacity="0.35" />
      <path
        d="M6 9H3M6 12H3M6 15H3M18 9H21M18 12H21M18 15H21M9 6V3M12 6V3M15 6V3M9 18V21M12 18V21M15 18V21"
        stroke="white"
        strokeOpacity="0.8"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function TurboIcon() {
  return (
    <svg width="220" height="220" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 1 0 9 9" stroke="white" strokeOpacity="0.85" strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="12" r="3.2" fill="white" fillOpacity="0.9" />
      <path d="M19.5 9.5 L23 8 L22 11.5 Z" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

function SparkPlugIcon() {
  return (
    <svg width="160" height="230" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="5" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="10.3" y="7" width="3.4" height="9" fill="white" fillOpacity="0.75" />
      <path
        d="M10 16 L10 19 M14 16 L14 19 M10 19 L12 21 L14 19"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

function InjectorIcon() {
  return (
    <svg width="170" height="230" viewBox="0 0 24 24" fill="none">
      <rect x="9.5" y="2" width="5" height="12" rx="2" fill="white" fillOpacity="0.88" />
      <path d="M10 14 L9 18 M12 14 L12 19 M14 14 L15 18" stroke="white" strokeOpacity="0.8" strokeWidth="1.1" />
      <circle cx="9" cy="20" r="0.8" fill="white" fillOpacity="0.6" />
      <circle cx="12" cy="21.5" r="0.8" fill="white" fillOpacity="0.6" />
      <circle cx="15" cy="20" r="0.8" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function RadiatorIcon() {
  return (
    <svg width="230" height="190" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="white" strokeOpacity="0.85" strokeWidth="1.3" fill="none" />
      <path d="M7 5V19M11 5V19M15 5V19" stroke="white" strokeOpacity="0.6" strokeWidth="1" />
      <rect x="1" y="8" width="2" height="8" fill="white" fillOpacity="0.7" />
      <rect x="21" y="8" width="2" height="8" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="220" height="200" viewBox="0 0 24 24" fill="none">
      <path d="M4 8 L20 8 L16 20 L8 20 Z" stroke="white" strokeOpacity="0.85" strokeWidth="1.3" fill="white" fillOpacity="0.15" />
      <path
        d="M6.5 8 L17.5 8M7.4 11 L16.6 11M8.3 14 L15.7 14M9.2 17 L14.8 17"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="1"
      />
    </svg>
  );
}

function TireIcon() {
  return (
    <svg width="220" height="220" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.85" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.3" />
      <rect x="11" y="1.2" width="2" height="2.4" fill="white" fillOpacity="0.8" />
      <rect x="11" y="20.4" width="2" height="2.4" fill="white" fillOpacity="0.8" />
      <rect x="1.2" y="11" width="2.4" height="2" fill="white" fillOpacity="0.8" />
      <rect x="20.4" y="11" width="2.4" height="2" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

function SpoilerIcon() {
  return (
    <svg width="260" height="140" viewBox="0 0 100 50" fill="none">
      <path d="M5 40 L95 40" stroke="white" strokeOpacity="0.85" strokeWidth="3" />
      <path d="M20 40 L20 20 L80 20 L80 40" stroke="white" strokeOpacity="0.85" strokeWidth="3" fill="none" />
      <rect x="15" y="38" width="8" height="6" fill="white" fillOpacity="0.8" />
      <rect x="77" y="38" width="8" height="6" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

function BumperIcon() {
  return (
    <svg width="260" height="160" viewBox="0 0 100 50" fill="none">
      <path d="M8 10 Q50 2 92 10 L88 38 Q50 46 12 38 Z" fill="white" fillOpacity="0.85" />
      <path d="M25 14 L25 32M40 12 L40 34M60 12 L60 34M75 14 L75 32" stroke="black" strokeOpacity="0.3" strokeWidth="2" />
    </svg>
  );
}

function WaxTinIcon() {
  return (
    <svg width="200" height="200" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="7" rx="7" ry="2.6" fill="white" fillOpacity="0.9" />
      <path d="M5 7v9a7 2.6 0 0 0 14 0V7" stroke="white" strokeOpacity="0.85" strokeWidth="1.3" fill="none" />
      <ellipse cx="12" cy="16" rx="7" ry="2.6" stroke="white" strokeOpacity="0.5" strokeWidth="1" fill="none" />
    </svg>
  );
}

function MicrofiberClothIcon() {
  return (
    <svg width="220" height="200" viewBox="0 0 24 24" fill="none">
      <path d="M4 5 Q12 2 20 5 L19 18 Q12 21 5 18 Z" fill="white" fillOpacity="0.85" />
      <path d="M7 8 Q12 6 17 8M6.5 12 Q12 10 17.5 12M7 16 Q12 14 17 16" stroke="black" strokeOpacity="0.25" strokeWidth="1" fill="none" />
    </svg>
  );
}

function PolisherMachineIcon() {
  return (
    <svg width="230" height="220" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="7" fill="white" fillOpacity="0.85" />
      <circle cx="12" cy="15" r="2.5" fill="black" fillOpacity="0.3" />
      <rect x="10.5" y="2" width="3" height="8" rx="1.4" fill="white" fillOpacity="0.9" />
      <path d="M8 4 L16 4" stroke="white" strokeOpacity="0.85" strokeWidth="1.6" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg width="200" height="230" viewBox="0 0 24 24" fill="none">
      <rect x="10.5" y="2" width="3" height="13" rx="1.2" fill="white" fillOpacity="0.9" />
      <path d="M6 15 L18 15 L17 19 Q12 21.5 7 19 Z" fill="white" fillOpacity="0.85" />
      <path d="M8 16.5V19M12 16.8V20M16 16.5V19" stroke="black" strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  );
}

function SprayBottleIcon() {
  return (
    <svg width="180" height="230" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="10" width="9" height="11" rx="1.6" fill="white" fillOpacity="0.88" />
      <rect x="10.5" y="6" width="2.4" height="4.5" fill="white" fillOpacity="0.8" />
      <rect x="9.3" y="4.5" width="3.6" height="2" rx="0.6" fill="white" fillOpacity="0.9" />
      <path d="M10 6 L6 4M6 4 L4.5 2.5M6 4 L4 5" stroke="white" strokeOpacity="0.85" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function PadIcon() {
  return (
    <svg width="210" height="210" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="white" fillOpacity="0.85" />
      <circle cx="8" cy="9" r="1" fill="black" fillOpacity="0.25" />
      <circle cx="15" cy="8" r="1" fill="black" fillOpacity="0.25" />
      <circle cx="16" cy="14" r="1" fill="black" fillOpacity="0.25" />
      <circle cx="9" cy="15" r="1" fill="black" fillOpacity="0.25" />
      <circle cx="12" cy="12" r="1" fill="black" fillOpacity="0.25" />
    </svg>
  );
}

function CoverIcon() {
  return (
    <svg width="250" height="160" viewBox="0 0 100 50" fill="none">
      <path d="M6 40 Q10 15 50 12 Q90 15 94 40 Z" fill="white" fillOpacity="0.85" />
      <path d="M20 40 Q50 30 80 40" stroke="black" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <rect x="44" y="40" width="12" height="6" rx="2" fill="black" fillOpacity="0.3" />
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

// ─── Sélection de l'icône selon le TYPE de produit détecté dans le nom ─────
//
// Les règles sont évaluées dans l'ordre et la première qui matche l'emporte.
// L'ordre place volontairement "ce qu'est l'objet" (un outil, une machine,
// un pad, une brosse, un chiffon, une cire, un soin céramique/polish, un
// liquide nettoyant/additif, une housse) AVANT "à quoi il s'applique"
// (jante, échappement, pare-choc...), pour éviter par exemple qu'un
// "Nettoyant jantes" ou une "Brosse jantes" héritent de l'icône jante plutôt
// que de leur icône réelle de flacon/brosse.

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, " ");
}

interface IconRule {
  test: (n: string) => boolean;
  icon: React.ReactElement;
}

function includesAny(n: string, keywords: string[]): boolean {
  return keywords.some((k) => n.includes(k));
}

const ICON_RULES: IconRule[] = [
  // 1. Électronique moteur
  { test: (n) => includesAny(n, ["reprogrammation", "piggyback"]) || /\becu\b/.test(n), icon: <EcuChipIcon /> },

  // 2. Films / covering / PPF / vitres teintées — vérifié tôt pour ne pas se
  //    faire piéger par l'objet visé (ex: "Film de protection phares", "PPF jantes").
  {
    test: (n) =>
      includesAny(n, ["film", "ppf", "covering", "teinte"]) || (n.includes("primer") && n.includes("adherence")),
    icon: <FilmRollIcon />,
  },

  // 3. Outils à main
  {
    test: (n) =>
      includesAny(n, [
        "cutter",
        "racle",
        "compresseur",
        "manometre",
        "jauge",
        "pistolet thermique",
        "pistolet a graisse",
        "outillage",
        "outil",
      ]) || /\bcle\b/.test(n),
    icon: <ToolboxIcon />,
  },

  // 4. Machines électriques/pneumatiques d'atelier
  {
    test: (n) =>
      includesAny(n, ["polisseuse", "nettoyeur", "aspirateur", "souffleur", "lance a mousse", "pistolet pneumatique"]),
    icon: <PolisherMachineIcon />,
  },

  // 5. Pads de polissage
  { test: (n) => n.includes("pad"), icon: <PadIcon /> },

  // 6. Brosses / pinceaux
  { test: (n) => includesAny(n, ["brosse", "pinceau"]), icon: <BrushIcon /> },

  // 7. Chiffons / gants / serviettes
  {
    test: (n) => includesAny(n, ["chiffon", "microfibre", "gant", "mitaine", "serviette", "chamois", "lingette"]),
    icon: <MicrofiberClothIcon />,
  },

  // 8. Cires
  { test: (n) => includesAny(n, ["cire", "wax"]), icon: <WaxTinIcon /> },

  // 9. Céramique / polish / correction
  {
    test: (n) => includesAny(n, ["ceramique", "polish", "compound", "scellant", "topcoat", "silice", "correcteur"]),
    icon: <SparkleDropIcon />,
  },

  // 10. Liquides d'entretien / additifs / nettoyants
  {
    test: (n) =>
      includesAny(n, [
        "nettoyant",
        "shampoing",
        "additif",
        "contamin",
        "calamin",
        "degraissant",
        "spray",
        "mouss",
        "foam",
        "revitalisant",
        "traitement",
        "lubrifiant",
        "desodorisant",
        "concentre",
        "argile",
        "clay",
      ]) || /\bgel\b/.test(n),
    icon: <SprayBottleIcon />,
  },

  // 10bis. Housses / bâches / sacs de rangement
  { test: (n) => includesAny(n, ["housse", "bache", "sac de rangement"]), icon: <CoverIcon /> },

  // 11. Pièces mécaniques et visuelles identifiables — du plus spécifique au
  //     plus générique, pour que les mots-clés larges (roue, capot...) ne
  //     masquent pas un composant plus précis (turbo, injecteur...).
  { test: (n) => n.includes("turbo"), icon: <TurboIcon /> },
  { test: (n) => includesAny(n, ["bougie", "bobine"]), icon: <SparkPlugIcon /> },
  { test: (n) => n.includes("injecteur") || n.includes("pompe a carburant"), icon: <InjectorIcon /> },
  { test: (n) => includesAny(n, ["radiateur", "intercooler", "refroidisseur"]), icon: <RadiatorIcon /> },
  { test: (n) => includesAny(n, ["filtre", "admission"]), icon: <FilterIcon /> },
  {
    test: (n) =>
      includesAny(n, ["echappement", "silencieux", "downpipe", "collecteur", "resonateur", "embout", "lambda"]) ||
      n.startsWith("ligne "),
    icon: <ExhaustIcon />,
  },
  {
    test: (n) => includesAny(n, ["jante", "roue", "boulon", "ecrou", "entretoise", "tpms", "etrier", "valve"]),
    icon: <WheelIcon />,
  },
  { test: (n) => n.includes("pneu"), icon: <TireIcon /> },
  { test: (n) => includesAny(n, ["spoiler", "aileron", "becquet", "diffuseur", "splitter"]), icon: <SpoilerIcon /> },
  {
    test: (n) =>
      includesAny(n, ["phare", "feu", "ampoule", "projecteur", "xenon", "clignotant", "optique"]) || /\bled\b/.test(n),
    icon: <HeadlightIcon />,
  },
  {
    test: (n) =>
      includesAny(n, [
        "pare-choc",
        "pare choc",
        "calandre",
        "capot",
        "jupe",
        "canard",
        "widebody",
        "elargisseur",
        "extension d",
        "carrosserie",
        "prise d",
        "ouie",
        "hayon",
        "coffre",
        "grille de",
      ]),
    icon: <BumperIcon />,
  },
];

function getProductIcon(name: string, categoryId: string): React.ReactElement {
  const n = normalizeName(name);
  for (const rule of ICON_RULES) {
    if (rule.test(n)) return rule.icon;
  }
  return (CATEGORY_VISUALS[categoryId] ?? FALLBACK_VISUAL).icon;
}

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
  const icon = getProductIcon(product.name, product.categoryId);

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
          {icon}
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
