import { db } from "../src/lib/prisma";
import { encryptSecret } from "../src/lib/auth/encryption";
import { hashPassword } from "../src/lib/auth/password";
import { hashRecoveryCode } from "../src/lib/auth/recovery";
import { generateTotpSecret } from "../src/lib/auth/totp";

const ownerEmail = process.env.E2E_OWNER_EMAIL ?? "e2e-owner@example.test";
const memberEmail = process.env.E2E_MEMBER_EMAIL ?? "e2e-member@example.test";
const outsiderEmail = process.env.E2E_OUTSIDER_EMAIL ?? "e2e-outsider@example.test";
const password = process.env.E2E_PASSWORD ?? "E2E-Password-Change-Me-123!";
const recoveryCodes = Array.from({ length: 10 }, (_, index) => `E2E-RECOVERY-${String(index + 1).padStart(2, "0")}`);

async function main() {
  await db.user.deleteMany({ where: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } } });

  const passwordHash = await hashPassword(password);
  const secretEnc = encryptSecret(generateTotpSecret());

  const owner = await db.user.create({
    data: {
      email: ownerEmail,
      name: "E2E Owner",
      emailVerifiedAt: new Date(),
      passwordCredential: { create: { passwordHash } },
      mfaFactors: {
        create: { type: "TOTP", secretEnc, label: "E2E Authenticator", verifiedAt: new Date() },
      },
      recoveryCodes: {
        create: await Promise.all(recoveryCodes.map(async (code) => ({ codeHash: await hashRecoveryCode(code) }))),
      },
    },
  });

  const member = await db.user.create({
    data: {
      email: memberEmail,
      name: "E2E Member",
      emailVerifiedAt: new Date(),
      passwordCredential: { create: { passwordHash } },
    },
  });

  const outsider = await db.user.create({
    data: {
      email: outsiderEmail,
      name: "E2E Outsider",
      emailVerifiedAt: new Date(),
      passwordCredential: { create: { passwordHash } },
    },
  });

  const workspace = await db.workspace.create({
    data: {
      name: "E2E Workspace",
      slug: "e2e-workspace",
      ownerId: owner.id,
      memberships: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: member.id, role: "EDITOR" },
        ],
      },
    },
  });

  const outsiderWorkspace = await db.workspace.create({
    data: {
      name: "E2E Outsider Workspace",
      slug: "e2e-outsider-workspace",
      ownerId: outsider.id,
      memberships: { create: [{ userId: outsider.id, role: "OWNER" }] },
    },
  });

  console.log(JSON.stringify({
    ownerEmail,
    memberEmail,
    outsiderEmail,
    password,
    workspaceId: workspace.id,
    outsiderWorkspaceId: outsiderWorkspace.id,
    recoveryCodes,
  }));
}

main().finally(async () => db.$disconnect());
