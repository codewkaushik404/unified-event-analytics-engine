import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers.js";
import prisma from "../src/config/prismaClient.js";
import redis from "../src/config/redisClient.js";

const db: any = prisma;
const cache: any = redis;
const app = buildApp();
const LOGGED_IN = { "x-test-user": "1" };

beforeEach(() => {
    vi.clearAllMocks();
    cache.get.mockResolvedValue(null); // cache miss by default
});

describe("POST /api/analytics/event-summary", () => {
    it("returns count, unique users and device data", async () => {
        db.event.findMany.mockResolvedValue([
            { event_type: "CLICK", device: "MOBILE", external_user_id: "u1" },
            { event_type: "CLICK", device: "MOBILE", external_user_id: "u2" },
            { event_type: "CLICK", device: "DESKTOP", external_user_id: "u1" },
        ]);

        const res = await request(app).post("/api/analytics/event-summary").set(LOGGED_IN)
            .send({ event: "login_form_cta_click" });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            count: 3,
            uniqueUsers: 2,
            deviceData: { mobile: 2, desktop: 1 }
        });
    });

    it("serves cached data without hitting the database", async () => {
        cache.get.mockResolvedValue(JSON.stringify({ count: 99 }));
        const res = await request(app).post("/api/analytics/event-summary").set(LOGGED_IN)
            .send({ event: "login_form_cta_click" });

        expect(res.body.data.count).toBe(99);
        expect(db.event.findMany).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid payload", async () => {
        const res = await request(app).post("/api/analytics/event-summary").set(LOGGED_IN).send({});
        expect(res.status).toBe(400);
    });
});

describe("GET /api/analytics/user-stats", () => {
    it("returns total events, IPs, browsers and OS", async () => {
        db.event.findMany.mockResolvedValue([
            { browser: "chrome", ip_address: "1.1.1.1", metadata: { os: "Android" } },
            { browser: "firefox", ip_address: "2.2.2.2", metadata: { os: "Windows" } },
        ]);

        const res = await request(app).get("/api/analytics/user-stats?userId=user789").set(LOGGED_IN);

        expect(res.status).toBe(200);
        expect(res.body.data.totalEvents).toBe(2);
        expect(res.body.data.deviceDetails.browser).toEqual(["chrome", "firefox"]);
    });

    it("returns 404 when the user has no events", async () => {
        db.event.findMany.mockResolvedValue([]);
        const res = await request(app).get("/api/analytics/user-stats?userId=ghost").set(LOGGED_IN);
        expect(res.status).toBe(404);
    });
});