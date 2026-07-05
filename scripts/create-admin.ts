import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Bootstraps the first ADMIN account. Nobody can self-assign the ADMIN
 * role, so this standalone script is the only way to seed one.
 *
 * Usage:
 *   ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run seed:admin
 *
 * `@/lib/auth` is imported dynamically (after dotenv has loaded) rather
 * than statically, because ESM hoists static imports above this file's
 * own top-level code — that would construct the Resend client (inside
 * auth.ts) before RESEND_API_KEY is even in process.env.
 */
async function main() {
  const { auth } = await import("@/lib/auth");
  const { prisma } = await import("@/lib/prisma");
  const { UserRole } = await import("@/generated/prisma/enums");

  const name = process.env.ADMIN_NAME || process.argv[2];
  const email = process.env.ADMIN_EMAIL || process.argv[3];
  const password = process.env.ADMIN_PASSWORD || process.argv[4];

  if (!name || !email || !password) {
    console.error(
      "Usage: ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin\n" +
        "   or: npm run seed:admin -- \"Full Name\" you@example.com yourPassword123"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN, emailVerified: true },
    });
    console.log(`Promoted existing user to ADMIN: ${email}`);
    process.exit(0);
  }

  const result = await auth.api.signUpEmail({ body: { name, email, password } });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: UserRole.ADMIN, emailVerified: true },
  });

  console.log(`Created ADMIN account: ${email} (id: ${result.user.id})`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create admin:", error);
  process.exit(1);
});
