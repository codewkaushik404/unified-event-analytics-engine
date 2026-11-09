import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers.js";
import prisma from "../src/config/prismaClient.js";
import { encryptApiKey } from "../src/utils/encryption.js";

const db: any = prisma;
const app = buildApp();
const LOGGED_IN = { "x-test-user": "1" };

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/register", () => {
    it("creates the app and returns an API key", async () => {
        db.app.create.mockResolvedValue({ id: 5 });
        db.apiKey.create.mockResolvedValue({});

        const res = await request(app).post("/api/auth/register").set(LOGGED_IN)
            .send({ name: "My App", website_url: "https://a.com" });

        expect(res.status).toBe(201);
        expect(res.body.data.api_key).toMatch(/^key_live_/);
    });

    it("returns 400 for an invalid payload", async () => {
        const res = await request(app).post("/api/auth/register").set(LOGGED_IN)
            .send({ name: "ab", website_url: "not-a-url" });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/auth/api-key", () => {
    it("returns the decrypted API key", async () => {
        const enc = encryptApiKey("key_live_abc123");
        db.apiKey.findMany.mockResolvedValue([{ id: 1, app_id: 1, ...enc }]);

        const res = await request(app).get("/api/auth/api-key?app_id=1").set(LOGGED_IN);

        expect(res.status).toBe(200);
        expect(res.body.data[0].api_key).toBe("key_live_abc123");
    });

    it("returns 401 when not logged in", async () => {
        const res = await request(app).get("/api/auth/api-key?app_id=1");
        expect(res.status).toBe(401);
    });
});

describe("POST /api/auth/revoke", () => {
    it("revokes an active key", async () => {
        db.apiKey.updateMany.mockResolvedValue({ count: 1 });
        const res = await request(app).post("/api/auth/revoke").set(LOGGED_IN).send({ app_id: 1, key_id: 1 });
        expect(res.status).toBe(200);
    });

    it("returns 404 when the key is not found", async () => {
        db.apiKey.updateMany.mockResolvedValue({ count: 0 });
        const res = await request(app).post("/api/auth/revoke").set(LOGGED_IN).send({ app_id: 1, key_id: 99 });
        expect(res.status).toBe(404);
    });
});

describe("GET /api/auth/me", () => {
    it("returns the logged-in user", async () => {
        const res = await request(app).get("/api/auth/me").set(LOGGED_IN);
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe("test@example.com");
    });

    it("returns 401 when not logged in", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });
});