import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { hash } from "bcryptjs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const adminEmail = "admin@palmvintage.com";
  const adminPassword = "palmvintage2024";

  const existing = await client.query(
    'SELECT id FROM "User" WHERE email = $1',
    [adminEmail]
  );

  if (existing.rows.length > 0) {
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const passwordHash = await hash(adminPassword, 12);
  const id = "c" + [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

  await client.query(
    `INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, adminEmail, passwordHash, "Palm Vintage Admin", "admin"]
  );

  console.log("Admin created:");
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
}

main()
  .catch(console.error)
  .finally(() => client.end());
