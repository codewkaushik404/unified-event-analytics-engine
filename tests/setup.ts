import { vi } from "vitest";

vi.mock("../src/config/prismaClient.js", () => {
    const prisma: any = {
        app: { create: vi.fn() },
        apiKey: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
        event: { create: vi.fn(), findMany: vi.fn() },
    };
    prisma.$transaction = vi.fn(async (cb: any) => cb(prisma));
    return { default: prisma };
});

vi.mock("../src/config/redisClient.js", () => ({
    default: { get: vi.fn(), set: vi.fn(), sendCommand: vi.fn() }
}));

vi.mock("../src/utils/customRateLimiter.js", () => ({
    default: () => (_req: any, _res: any, next: any) => next()
}));

vi.mock("../src/config/passport.js", () => ({
    default: { authenticate: () => (_req: any, _res: any, next: any) => next() }
}));
