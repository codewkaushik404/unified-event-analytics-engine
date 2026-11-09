import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        setupFiles: ["tests/setup.ts"],
        // Fake env values so config.ts doesn't throw. No real services are used in tests.
        env: {
            PORT: "8000",
            ENVIRONMENT: "development",
            SESSION_SECRET: "test-secret",
            CLIENT_ID: "test-client-id",
            CLIENT_SECRET: "test-client-secret",
            CALLBACK_URL: "http://localhost:8000/api/auth/google/callback",
            DATABASE_URL: "postgresql://user:password@localhost:5432/test",
            ENCRYPTION_KEY: "0".repeat(64) // 32 bytes in hex
        }
    }
});
