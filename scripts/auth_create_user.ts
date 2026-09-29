// Creates or updates an application login (not a SISTER account).
//
//   bun run auth:create-user --email admin@pt.ac.id --name "Admin PT" --role ADMIN
//   echo "$PASSWORD" | bun run auth:create-user --email ... --name ... --role VIEWER
//   bun run auth:create-user --email user@pt.ac.id --deactivate
//
// The password is read from stdin (hidden when typed in a terminal), never
// from argv, so it does not end up in shell history or the process list.
// Running it for an existing email resets the password and updates name/role.
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import type { AppRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/server/db/prisma";

const roles: AppRole[] = ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"];
const minPasswordLength = 12;

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "VIEWER" },
    deactivate: { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

async function readPassword(prompt: string) {
  const input = process.stdin;
  const rl = createInterface({ input, output: process.stdout, terminal: input.isTTY });
  if (input.isTTY) {
    process.stdout.write(prompt);
    // Mute echo while the password is typed.
    (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = () => {};
  }
  const line = await new Promise<string>((resolve) => rl.once("line", resolve));
  rl.close();
  if (input.isTTY) {
    process.stdout.write("\n");
  }
  return line;
}

const email = values.email?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  fail("--email is required and must be a valid address.");
}

try {
  if (values.deactivate) {
    const user = await prisma.appUser.update({
      where: { email },
      data: { isActive: false, authSessions: { deleteMany: {} } },
      select: { id: true },
    });
    console.log(`Deactivated ${email} (${user.id}) and revoked its sessions.`);
    process.exit(0);
  }

  const role = values.role?.toUpperCase() as AppRole;
  if (!roles.includes(role)) {
    fail(`--role must be one of ${roles.join(", ")}.`);
  }
  const name = values.name?.trim();
  if (!name) {
    fail("--name is required.");
  }

  const password = await readPassword(`Password for ${email} (min ${minPasswordLength} chars): `);
  if (password.length < minPasswordLength || password.length > 128) {
    fail(`Password must be ${minPasswordLength}-128 characters.`);
  }
  if (process.stdin.isTTY) {
    const confirmation = await readPassword("Repeat password: ");
    if (confirmation !== password) {
      fail("Passwords do not match.");
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const saved = await tx.appUser.upsert({
      where: { email },
      create: { email, name, role, isActive: true, emailVerified: true },
      update: { name, role, isActive: true },
      select: { id: true },
    });
    const existing = await tx.authAccount.findFirst({
      where: { userId: saved.id, providerId: "credential" },
      select: { id: true },
    });
    if (existing) {
      await tx.authAccount.update({ where: { id: existing.id }, data: { password: passwordHash } });
      // A password reset ends every open session of that user.
      await tx.authSession.deleteMany({ where: { userId: saved.id } });
    } else {
      await tx.authAccount.create({
        data: {
          id: randomUUID(),
          userId: saved.id,
          accountId: saved.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }
    return saved;
  });

  console.log(`Saved ${email} as ${role} (${user.id}).`);
} finally {
  await prisma.$disconnect();
}
