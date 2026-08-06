import { config } from "dotenv";

// Next.js loads .env files itself; this is for standalone scripts (drizzle-kit, seed).
config({ path: [".env.local", ".env"], quiet: true });
