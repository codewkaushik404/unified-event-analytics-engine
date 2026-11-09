import dotenv from "dotenv";
dotenv.config();

if(!process.env.PORT) throw new Error("PORT env variable not found");
if(!process.env.CLIENT_ID) throw new Error("CLIENT_ID is not set in env variables")
if(!process.env.CLIENT_SECRET) throw new Error("CLIENT_SECRET is not set in env variables");
if(!process.env.CALLBACK_URL) throw new Error("CALLBACK_URL is not set in env variables");

if(!process.env.ENVIRONMENT) throw new Error("ENVIRONMENT is not set in env variables");
if(!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set in env variables");

if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in env variables");
if(!process.env.ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY is not set in env variables");

const config = {
    PORT: process.env.PORT,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    CALLBACK_URL: process.env.CALLBACK_URL,

    SESSION_SECRET: process.env.SESSION_SECRET,
    ENVIRONMENT: process.env.ENVIRONMENT,

    DATABASE_URL: process.env.DATABASE_URL,

    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379"
}

export default config;