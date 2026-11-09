import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { buildApp, validEvent } from "./helpers.js";
import prisma from "../src/config/prismaClient.js";

const db: any = prisma;
const app = buildApp();
const KEY = { "x-api-key": "key_live_valid" };

beforeEach(() => {
    vi.clearAllMocks();
    db.apiKey.findUnique.mockResolvedValue({ app_id: 7, app: { owner_id: 1 } });
});

describe("POST /api/analytics/collect", () => {
    it("stores a valid event", async () => {
        const res = await request(app).post("/api/analytics/collect").set(KEY).send(validEvent);

        expect(res.status).toBe(204);
        const saved = db.event.create.mock.calls[0][0].data;
        expect(saved.app_id).toBe(7);
        expect(saved.event_type).toBe("CLICK");
    });

    it("returns 400 when the API key header is missing", async () => {
        const res = await request(app).post("/api/analytics/collect").send(validEvent);
        expect(res.status).toBe(400);
    });

    it("returns 404 for an invalid or revoked API key", async () => {
        db.apiKey.findUnique.mockResolvedValue(null);
        const res = await request(app).post("/api/analytics/collect").set(KEY).send(validEvent);
        expect(res.status).toBe(404);
    });
});