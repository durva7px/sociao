import "dotenv/config";
import { prisma } from "../src/db.js";
import { DEMO_PASSWORD, seed } from "../src/seed/seed.js";

// Run with `npm run db:seed`. Resets the database named in .env (dev data, never the test DB).
const { users, posts } = await seed(prisma);
console.log(`Seeded ${users} users and ${posts} posts. Demo password for every user: ${DEMO_PASSWORD}`);
await prisma.$disconnect();
