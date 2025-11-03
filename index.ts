import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// QUERY RINGAN - Simple CRUD Operations
// ============================================
export async function lightweightQuery() {
  console.log("🟢 Starting Lightweight Query...");
  const startTime = Date.now();

  try {
    // 1. Insert single user
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: `john.${Date.now()}@example.com`,
      },
    });

    // 2. Simple select by ID
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // 3. Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { name: "John Updated" },
    });

    // 4. Create single post
    const post = await prisma.post.create({
      data: {
        title: "My First Post",
        content: "This is a simple post content",
        authorId: user.id,
      },
    });

    // 5. Simple select with relation
    const userWithPosts = await prisma.user.findUnique({
      where: { id: user.id },
      include: { posts: true },
    });

    const endTime = Date.now();
    console.log(`✅ Lightweight Query completed in ${endTime - startTime}ms`);
    console.log(`   - Created user: ${user.id}`);
    console.log(`   - Created post: ${post.id}`);
    console.log(`   - User has ${userWithPosts?.posts.length} post(s)`);

    return { user, post, duration: endTime - startTime };
  } catch (error) {
    console.error("❌ Lightweight Query failed:", error);
    throw error;
  }
}

// ============================================
// QUERY SEDANG - Batch Operations & Aggregations
// ============================================
export async function mediumQuery() {
  console.log("🟡 Starting Medium Query...");
  const startTime = Date.now();

  try {
    // 1. Batch insert users (100 users)
    const userPromises = Array.from({ length: 100 }, (_, i) =>
      prisma.user.create({
        data: {
          name: `User ${i}`,
          email: `user${i}.${Date.now()}@example.com`,
        },
      })
    );
    const users = await Promise.all(userPromises);

    // 2. Batch insert posts (300 posts - 3 per user)
    const postPromises = users.flatMap((user) =>
      Array.from({ length: 3 }, (_, i) =>
        prisma.post.create({
          data: {
            title: `Post ${i} by ${user.name}`,
            content: `Content for post ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            authorId: user.id,
          },
        })
      )
    );
    const posts = await Promise.all(postPromises);

    // 3. Complex query with filtering and pagination
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // 4. Aggregation queries
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();

    const usersWithPostCount = await prisma.user.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      take: 20,
    });

    // 5. Bulk update
    await prisma.post.updateMany({
      where: {
        authorId: { in: users.slice(0, 10).map((u) => u.id) },
      },
      data: {
        content: "Updated content for bulk operation",
      },
    });

    const endTime = Date.now();
    console.log(`✅ Medium Query completed in ${endTime - startTime}ms`);
    console.log(`   - Created ${users.length} users`);
    console.log(`   - Created ${posts.length} posts`);
    console.log(`   - Total users in DB: ${userCount}`);
    console.log(`   - Total posts in DB: ${postCount}`);
    console.log(`   - Recent posts found: ${recentPosts.length}`);

    return {
      users,
      posts,
      recentPosts,
      userCount,
      postCount,
      duration: endTime - startTime,
    };
  } catch (error) {
    console.error("❌ Medium Query failed:", error);
    throw error;
  }
}

// ============================================
// QUERY BERAT - Complex Transactions & Heavy Operations
// ============================================
export async function heavyQuery() {
  console.log("🔴 Starting Heavy Query...");
  const startTime = Date.now();

  try {
    // 1. MASSIVE batch insert in multiple batches (5000 users + 25000 posts)
    console.log("   📦 Phase 1: Creating 5000 users in batches...");
    const allUsers: any[] = [];
    const batchSize = 500;
    const totalUserBatches = 10; // 10 batches x 500 = 5000 users

    for (let batch = 0; batch < totalUserBatches; batch++) {
      console.log(`      - Batch ${batch + 1}/${totalUserBatches}...`);
      const users = await Promise.all(
        Array.from({ length: batchSize }, (_, i) =>
          prisma.user.create({
            data: {
              name: `Heavy User ${batch * batchSize + i}`,
              email: `heavy.user${batch}.${i}.${Date.now()}.${Math.random()}@example.com`,
            },
          })
        )
      );
      allUsers.push(...users);
    }

    console.log("   📦 Phase 2: Creating 25000 posts in batches...");
    const allPosts: any[] = [];
    const postBatchSize = 500;
    const totalPostBatches = 50; // 50 batches x 500 = 25000 posts

    for (let batch = 0; batch < totalPostBatches; batch++) {
      console.log(`      - Batch ${batch + 1}/${totalPostBatches}...`);
      const posts = await Promise.all(
        Array.from({ length: postBatchSize }, (_, i) => {
          const randomUser =
            allUsers[Math.floor(Math.random() * allUsers.length)];
          return prisma.post.create({
            data: {
              title: `Heavy Post ${
                batch * postBatchSize + i
              } - Performance Test with Long Title to Increase Data Size`,
              content: `This is a very heavy content with substantial text to stress test the database I/O operations. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Additional padding text to make content larger: ${Math.random()
                .toString(36)
                .repeat(10)}`,
              authorId: randomUser.id,
            },
          });
        })
      );
      allPosts.push(...posts);
    }

    console.log("   🔍 Phase 3: Running intensive aggregation queries...");

    // 2. Multiple heavy aggregations - run sequentially to stress DB
    const totalUsers = await prisma.user.count();
    console.log(`      - Total users: ${totalUsers}`);

    const totalPosts = await prisma.post.count();
    console.log(`      - Total posts: ${totalPosts}`);

    // Heavy query 1: Get users with all their posts (stress test joins)
    console.log("      - Fetching users with all posts (1000 users)...");
    const usersWithAllPosts = await prisma.user.findMany({
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 1000,
    });

    // Heavy query 2: Get posts with deep nested relations
    console.log("      - Fetching posts with deep relations (2000 posts)...");
    const postsWithDeepRelations = await prisma.post.findMany({
      include: {
        author: {
          include: {
            posts: {
              take: 20,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    // Heavy query 3: Multiple complex filters
    console.log("      - Running complex filtered queries...");
    const complexFilters = await Promise.all([
      prisma.user.findMany({
        where: {
          posts: {
            some: {
              title: { contains: "Heavy" },
            },
          },
        },
        include: {
          posts: {
            where: {
              title: { contains: "Performance" },
            },
          },
        },
        take: 500,
      }),
      prisma.post.findMany({
        where: {
          AND: [
            { title: { contains: "Heavy" } },
            { content: { contains: "stress test" } },
          ],
        },
        include: { author: true },
        take: 1000,
      }),
    ]);

    console.log("   🔄 Phase 4: Running multiple heavy update operations...");

    // 3. Sequential heavy updates (stress write operations)
    console.log("      - Update 1: Updating posts content...");
    await prisma.post.updateMany({
      where: {
        title: { contains: "Heavy" },
      },
      data: {
        content:
          "UPDATED: Mass updated content for performance testing. This content has been modified to test database write performance under heavy load conditions.",
      },
    });

    console.log("      - Update 2: Updating user names...");
    await prisma.user.updateMany({
      where: {
        email: { contains: "heavy.user" },
      },
      data: {
        name: "UPDATED Heavy User - Performance Test",
      },
    });

    console.log("      - Update 3: Updating recent posts...");
    await prisma.post.updateMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      data: {
        title: "UPDATED TITLE - Heavy Load Test",
      },
    });

    // 4. Complex search operations (stress read with complex conditions)
    console.log("   🔎 Phase 5: Running multiple complex searches...");

    const searchResults = await Promise.all([
      prisma.user.findMany({
        where: {
          posts: {
            some: {
              AND: [
                { title: { contains: "UPDATED" } },
                { content: { contains: "performance" } },
              ],
            },
          },
        },
        include: {
          posts: {
            where: {
              title: { contains: "UPDATED" },
            },
            orderBy: { createdAt: "desc" },
            take: 15,
          },
          _count: {
            select: { posts: true },
          },
        },
        take: 800,
      }),
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: "Heavy" } },
            { title: { contains: "UPDATED" } },
            { content: { contains: "stress test" } },
          ],
        },
        include: {
          author: {
            include: {
              _count: {
                select: { posts: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1500,
      }),
    ]);

    // 5. Final heavy aggregation
    console.log("   📊 Phase 6: Final aggregation analysis...");
    const finalStats = await prisma.user.findMany({
      include: {
        posts: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 500,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `✅ Heavy Query completed in ${duration}ms (${(duration / 1000).toFixed(
        2
      )}s)`
    );
    console.log(`   - Created ${allUsers.length} users`);
    console.log(`   - Created ${allPosts.length} posts`);
    console.log(`   - Total users in DB: ${totalUsers}`);
    console.log(`   - Total posts in DB: ${totalPosts}`);
    console.log(
      `   - Users with all posts fetched: ${usersWithAllPosts.length}`
    );
    console.log(
      `   - Posts with deep relations: ${postsWithDeepRelations.length}`
    );
    console.log(
      `   - Complex filter results: ${
        complexFilters[0].length + complexFilters[1].length
      }`
    );
    console.log(
      `   - Search results: ${
        searchResults[0].length + searchResults[1].length
      }`
    );
    console.log(`   - Final stats entries: ${finalStats.length}`);

    return {
      allUsers,
      allPosts,
      totalUsers,
      totalPosts,
      usersWithAllPosts,
      postsWithDeepRelations,
      complexFilters,
      searchResults,
      finalStats,
      duration,
    };
  } catch (error) {
    console.error("❌ Heavy Query failed:", error);
    throw error;
  }
}

// ============================================
// STATISTICS CALCULATOR
// ============================================
interface Stats {
  avg: number;
  min: number;
  max: number;
  sd: number;
}

function calculateStats(values: number[]): Stats {
  const n = values.length;
  const avg = values.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Standard deviation
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / n;
  const sd = Math.sqrt(variance);

  return { avg, min, max, sd };
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(0)}ms`;
}

function printTable(title: string, data: { [key: string]: Stats }) {
  console.log("\n" + title);
  console.log(
    "┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐"
  );
  console.log(
    "│ Query Type      │ Average      │ Min          │ Max          │ Std Dev      │"
  );
  console.log(
    "├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤"
  );

  Object.entries(data).forEach(([key, stats]) => {
    const name = key.padEnd(15);
    const avg = formatDuration(stats.avg).padEnd(12);
    const min = formatDuration(stats.min).padEnd(12);
    const max = formatDuration(stats.max).padEnd(12);
    const sd = formatDuration(stats.sd).padEnd(12);
    console.log(`│ ${name} │ ${avg} │ ${min} │ ${max} │ ${sd} │`);
  });

  console.log(
    "└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘"
  );
}

// ============================================
// MAIN BENCHMARK RUNNER
// ============================================
export async function runBenchmark() {
  console.log("🚀 Starting Database Performance Benchmark (10 iterations)\n");

  const iterations = 10;
  const results = {
    lightweight: [] as number[],
    medium: [] as number[],
    heavy: [] as number[],
    total: [] as number[],
  };

  try {
    for (let i = 1; i <= iterations; i++) {
      console.log(`\n${"=".repeat(70)}`);
      console.log(`🔄 ITERATION ${i}/${iterations}`);
      console.log("=".repeat(70) + "\n");

      const iterationStart = Date.now();

      // Test 1: Lightweight
      const lightResult = await lightweightQuery();
      results.lightweight.push(lightResult.duration);
      console.log("\n" + "-".repeat(70) + "\n");

      // Test 2: Medium
      const mediumResult = await mediumQuery();
      results.medium.push(mediumResult.duration);
      console.log("\n" + "-".repeat(70) + "\n");

      // Test 3: Heavy
      const heavyResult = await heavyQuery();
      results.heavy.push(heavyResult.duration);

      const iterationEnd = Date.now();
      const totalTime = iterationEnd - iterationStart;
      results.total.push(totalTime);

      console.log("\n" + "-".repeat(70));
      console.log(
        `✅ Iteration ${i} completed in ${formatDuration(totalTime)}`
      );
      console.log(
        `   Light: ${formatDuration(
          lightResult.duration
        )} | Medium: ${formatDuration(
          mediumResult.duration
        )} | Heavy: ${formatDuration(heavyResult.duration)}`
      );
      console.log("-".repeat(70));

      // Add a small delay between iterations to let the system breathe
      if (i < iterations) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Calculate statistics
    console.log("\n\n" + "=".repeat(70));
    console.log("📊 FINAL BENCHMARK STATISTICS (10 iterations)");
    console.log("=".repeat(70));

    const stats = {
      Lightweight: calculateStats(results.lightweight),
      Medium: calculateStats(results.medium),
      Heavy: calculateStats(results.heavy),
      Total: calculateStats(results.total),
    };

    printTable("Performance Statistics", stats);

    // Additional insights
    console.log("\n📈 INSIGHTS:");
    console.log(
      `   • Lightweight queries are ${(
        stats.Heavy.avg / stats.Lightweight.avg
      ).toFixed(1)}x faster than Heavy queries`
    );
    console.log(
      `   • Heavy query variability (CV): ${(
        (stats.Heavy.sd / stats.Heavy.avg) *
        100
      ).toFixed(1)}%`
    );
    const mostConsistentKey = (() => {
      const filtered = Object.entries(stats).filter(([key]) => key !== "Total");
      if (filtered.length === 0) return "N/A";
      const [key] = filtered.reduce((min, cur) => {
        const [, minVal] = min;
        const [, curVal] = cur;
        return curVal.sd / curVal.avg < minVal.sd / minVal.avg ? cur : min;
      }, filtered[0]);
      return key;
    })();

    console.log(`   • Most consistent query: ${mostConsistentKey}`);

    // Raw data for export
    console.log("\n📋 RAW DATA (for external analysis):");
    console.log(
      "Lightweight:",
      results.lightweight.map((v) => v.toFixed(0)).join(", ")
    );
    console.log(
      "Medium:     ",
      results.medium.map((v) => v.toFixed(0)).join(", ")
    );
    console.log(
      "Heavy:      ",
      results.heavy.map((v) => v.toFixed(0)).join(", ")
    );
    console.log(
      "Total:      ",
      results.total.map((v) => v.toFixed(0)).join(", ")
    );

    return {
      results,
      stats,
    };
  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runBenchmark()
    .then(() => {
      console.log("\n✅ Benchmark completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Benchmark failed:", error);
      process.exit(1);
    });
}
