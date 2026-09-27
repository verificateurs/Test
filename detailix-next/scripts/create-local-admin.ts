import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL ?? "admin@detailix.local";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error(
    "ADMIN_PASSWORD manquant. Définis un mot de passe fort dans l'environnement avant d'exécuter ce script, ex. :\n" +
    "  ADMIN_PASSWORD=$(node -e \"console.log(require('crypto').randomBytes(18).toString('base64url'))\") npm run admin:create"
  );
  process.exit(1);
}

async function main() {
  // `password` est garanti défini ici (le contrôle ci-dessus appelle
  // process.exit(1) sinon) — TypeScript ne le déduit pas à travers la
  // fermeture de cette fonction déclarée séparément.
  const passwordHash = await hashPassword(password as string);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", totpEnabled: false, totpSecret: null },
    create: { email, passwordHash, role: "ADMIN" },
  });

  console.log(`Compte administrateur local prêt : ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
