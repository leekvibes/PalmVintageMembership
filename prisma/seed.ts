import "dotenv/config";
import { hash } from "bcryptjs";
import Database from "better-sqlite3";
import { randomBytes } from "crypto";

import { resolve } from "path";
const db = new Database(resolve(__dirname, "../dev.db"));

async function main() {
  const adminEmail = "admin@palmvintage.com";
  const adminPassword = "palmvintage2024";

  const existing = db
    .prepare("SELECT id FROM User WHERE email = ?")
    .get(adminEmail);

  if (existing) {
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const passwordHash = await hash(adminPassword, 12);
  const id = generateCuid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO User (id, email, passwordHash, name, role, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, adminEmail, passwordHash, "Palm Vintage Admin", "admin", now, now);

  console.log("Admin created:");
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("\nChange this password in production!");
}

function generateCuid(): string {
  return "c" + randomBytes(12).toString("hex");
}

main().catch(console.error);
