import express from "express";
import authRoutes from "../src/routes/auth.routes.js";
import analyticsRoutes from "../src/routes/analytics.routes.js";
import globalErrorHandler from "../src/utils/globalErrorHandler.js";

// Builds the real routes without Google login / sessions.
// Send header `x-test-user: 1` to act as logged-in user with id 1.
export function buildApp() {
    const app = express();
    app.use(express.json());

    app.use((req: any, _res, next) => {
        const id = req.headers["x-test-user"];
        req.isAuthenticated = () => Boolean(id);
        if (id) req.user = { id: Number(id), name: "Test User", email: "test@example.com" };
        next();
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use(globalErrorHandler);
    return app;
}

export const validEvent = {
    event: "login_form_cta_click",
    url: "https://example.com/page",
    referrer: "https://google.com",
    device: "mobile",
    ipAddress: "192.168.1.1",
    timestamp: "2024-02-20T12:34:56Z",
    userId: "user789",
    metadata: { browser: "Chrome", os: "Android", screenSize: "1080x1920" }
};
