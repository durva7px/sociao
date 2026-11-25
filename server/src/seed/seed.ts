import type { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../auth/password.js";

// Demo data for development and reviewers (GEN-03, D-027).
// Wipes every table first, so running it twice gives the same result.
// All seed Users share DEMO_PASSWORD, which is documented in the README.

export const DEMO_PASSWORD = "Sociao#2024";

const avatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;
const image = (seed: string) => `https://picsum.photos/seed/${seed}/900/700`;
// Short public sample clips (D-029). The Google sample bucket first chosen in D-027 now answers 403.
const VIDEOS = {
  flower: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", // MDN, CC0
  jellyfish: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
  bunny: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
};

const USERS = [
  { name: "Gustavo Levin", username: "gustavo.levin", avatarUrl: avatar(12) },
  { name: "Marilyn Torff", username: "marilyn.torff", avatarUrl: avatar(47) },
  { name: "Lindsey Septimus", username: "lindsey.septimus", avatarUrl: avatar(45) },
  { name: "Livia Botosh", username: "livia.botosh", avatarUrl: avatar(44) },
  { name: "Drake Morgan", username: "drake.morgan", avatarUrl: avatar(33) },
  { name: "Randy Vetrovs", username: "randy.vetrovs", avatarUrl: avatar(53) },
] as const;

type Username = (typeof USERS)[number]["username"];

/** Seed Users are recognised by this email, so a re-seed touches only them (D-030). */
const seedEmail = (u: { username: string }) => `${u.username}@sociao.test`;

interface SeedPost {
  author: Username;
  caption: string;
  minutesAgo: number;
  media?: { type: "IMAGE" | "VIDEO"; url: string };
  likedBy: Username[];
}

const POSTS: SeedPost[] = [
  {
    author: "marilyn.torff",
    caption: "Golden hour from the balcony again. Never gets old. 🌅",
    minutesAgo: 2,
    media: { type: "IMAGE", url: image("balcony-sunset") },
    likedBy: ["gustavo.levin", "lindsey.septimus", "livia.botosh", "drake.morgan"],
  },
  {
    author: "lindsey.septimus",
    caption: "Made pasta from scratch for the first time. Kitchen is a disaster, worth it. 🍝",
    minutesAgo: 25,
    likedBy: ["gustavo.levin", "marilyn.torff"],
  },
  {
    author: "gustavo.levin",
    caption: "New desk setup is finally done. Time to actually get some work done. 💪",
    minutesAgo: 70,
    media: { type: "IMAGE", url: image("desk-setup") },
    likedBy: ["marilyn.torff", "randy.vetrovs", "drake.morgan"],
  },
  {
    author: "drake.morgan",
    caption: "Weekend trail run, 12 km. Legs say no, brain says yes.",
    minutesAgo: 180,
    media: { type: "VIDEO", url: VIDEOS.flower },
    likedBy: ["gustavo.levin", "livia.botosh", "randy.vetrovs", "marilyn.torff", "lindsey.septimus"],
  },
  {
    author: "livia.botosh",
    caption: "Is it Friday yet? Asking for a friend. 😩",
    minutesAgo: 300,
    likedBy: ["drake.morgan"],
  },
  {
    author: "randy.vetrovs",
    caption: "Found this little café on the corner. Best flat white in town, no contest.",
    minutesAgo: 540,
    media: { type: "IMAGE", url: image("corner-cafe") },
    likedBy: [],
  },
  {
    author: "marilyn.torff",
    caption: "Rainy day playlist on, candle lit, book open. Perfect afternoon.",
    minutesAgo: 900,
    likedBy: ["livia.botosh", "lindsey.septimus"],
  },
  {
    author: "gustavo.levin",
    caption: "Quick edit from last month's trip. Mountains hit different. 🏔️",
    minutesAgo: 1_440,
    media: { type: "VIDEO", url: VIDEOS.jellyfish },
    likedBy: ["marilyn.torff", "drake.morgan", "livia.botosh"],
  },
  {
    author: "lindsey.septimus",
    caption: "Plant update: the monstera has opinions about where it lives now. 🌿",
    minutesAgo: 2_000,
    media: { type: "IMAGE", url: image("monstera") },
    likedBy: ["gustavo.levin"],
  },
  {
    author: "drake.morgan",
    caption: "Reminder to drink water and stretch. That's the post.",
    minutesAgo: 2_880,
    likedBy: ["randy.vetrovs", "lindsey.septimus"],
  },
  {
    author: "randy.vetrovs",
    caption: "Studio session tonight. Something new is coming. 🎧",
    minutesAgo: 3_600,
    media: { type: "VIDEO", url: VIDEOS.bunny },
    likedBy: ["gustavo.levin", "drake.morgan"],
  },
  {
    author: "livia.botosh",
    caption: "Sunday market haul. Too many tomatoes? There's no such thing.",
    minutesAgo: 4_320,
    media: { type: "IMAGE", url: image("market-haul") },
    likedBy: ["marilyn.torff", "randy.vetrovs", "gustavo.levin"],
  },
];

export async function seed(db: PrismaClient) {
  // Reset only the seed's own Users (D-030). Their Posts, Likes and Sessions cascade with them.
  // Everyone else stays. Their Likes on seed Posts go, since those Posts are recreated.
  await db.user.deleteMany({ where: { email: { in: USERS.map(seedEmail) } } });

  // bcrypt is slow on purpose, so hash the shared demo password once.
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const ids = {} as Record<Username, string>;
  for (const u of USERS) {
    const user = await db.user.create({
      data: {
        name: u.name,
        username: u.username,
        email: seedEmail(u),
        avatarUrl: u.avatarUrl,
        passwordHash,
      },
    });
    ids[u.username] = user.id;
  }

  const now = Date.now();
  for (const p of POSTS) {
    await db.post.create({
      data: {
        authorId: ids[p.author],
        caption: p.caption,
        mediaType: p.media?.type,
        mediaUrl: p.media?.url,
        createdAt: new Date(now - p.minutesAgo * 60_000),
        likes: { create: p.likedBy.map((username) => ({ userId: ids[username] })) },
      },
    });
  }

  return { users: USERS.length, posts: POSTS.length };
}
