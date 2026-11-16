import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const client = createClient({ url: redisUrl });
const prefix = `redis-learning:${Date.now()}`;

client.on("error", (error) => {
  console.error("Redis client error:", error);
});

const lessons = {
  async strings() {
    const key = `${prefix}:greeting`;
    await client.set(key, "Hello from Redis");
    console.log("GET:", await client.get(key));

    const counter = `${prefix}:page-views`;
    await client.incr(counter);
    await client.incr(counter);
    console.log("INCR page views:", await client.get(counter));

    const session = `${prefix}:session`;
    await client.set(session, "temporary-session", { EX: 30 });
    console.log("TTL session (seconds):", await client.ttl(session));
  },

  async hashes() {
    const key = `${prefix}:user:1001`;
    await client.hSet(key, {
      name: "Asha",
      role: "student",
      visits: "1",
    });
    await client.hIncrBy(key, "visits", 1);
    console.log("HGETALL user:", await client.hGetAll(key));
  },

  async lists() {
    const key = `${prefix}:queue`;
    await client.rPush(key, ["first job", "second job"]);
    console.log("LRANGE queue:", await client.lRange(key, 0, -1));
    console.log("LPOP queue:", await client.lPop(key));
  },

  async sets() {
    const key = `${prefix}:tags`;
    await client.sAdd(key, ["redis", "database", "redis"]);
    console.log("SMEMBERS tags:", await client.sMembers(key));
    console.log("SISMEMBER database:", await client.sIsMember(key, "database"));
  },

  async sortedSets() {
    const key = `${prefix}:leaderboard`;
    await client.zAdd(key, [
      { score: 120, value: "Asha" },
      { score: 95, value: "Sam" },
      { score: 150, value: "Lee" },
    ]);
    console.log("ZRANGE leaderboard:", await client.zRangeWithScores(key, 0, -1, {
      REV: true,
    }));
  },
};

async function main() {
  const requestedLesson = process.argv[2] ?? "all";

  if (requestedLesson !== "all" && !Object.hasOwn(lessons, requestedLesson)) {
    throw new Error(
      `Unknown lesson "${requestedLesson}". Choose: all, ${Object.keys(lessons).join(", ")}.`,
    );
  }

  await client.connect();
  const selectedLessons =
    requestedLesson === "all"
      ? Object.entries(lessons)
      : [[requestedLesson, lessons[requestedLesson]]];

  try {
    for (const [name, runLesson] of selectedLessons) {
      console.log(`\n--- ${name} ---`);
      await runLesson();
    }
  } finally {
    const keys = await client.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
    await client.quit();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
