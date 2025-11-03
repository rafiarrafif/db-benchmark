import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Run seeding...");

  // Create some dummy users
  const users = Array.from({ length: 10 }).map(() => ({
    id: randomUUID(),
    name: "User_" + randomUUID().slice(0, 8),
    email: `user_${randomUUID().slice(0, 8)}@example.com`,
  }));

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("✅ Successfully added dummy users");

  // Create some dummy posts linked to random users
  const posts = Array.from({ length: 30 }).map(() => ({
    id: randomUUID(),
    title: "Post_" + randomUUID().slice(0, 8),
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    authorId: users[Math.floor(Math.random() * users.length)].id,
  }));

  await prisma.post.createMany({
    data: posts,
    skipDuplicates: true,
  });

  console.log("✅ Successfully added dummy posts");
  console.log("🌿 Seeding complete!\n");
}

seed()
  .catch((e) => {
    console.error("❌ Error encountered:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
