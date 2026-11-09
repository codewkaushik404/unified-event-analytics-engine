import path from "node:path";
import { cwd } from "node:process";
import swaggerJsdoc from "swagger-jsdoc";

const apis = [
  path.join(cwd(), "src", "routes", "*.ts").replace(/\\/g, "/"),
  path.join(cwd(), "dist", "routes", "*.js").replace(/\\/g, "/")
];

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Event Analytics Engine API",
            version: "1.0.0",
            description: "API for registering applications, collecting events, and retrieving analytics."
        },
        servers: [{ url: "http://localhost:8000" }],
        components: {
            securitySchemes: {
                sessionCookie: {
                    type: "apiKey",
                    in: "cookie",
                    name: "sid",
                    description: "Session cookie established by Google OAuth login."
                },
                apiKey: {
                    type: "apiKey",
                    in: "header",
                    name: "x-api-key",
                    description: "Active API key issued when registering an application."
                }
            },
            schemas: {
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        statusCode: { type: "integer", example: 200 },
                        message: { type: "string", example: "Request completed successfully" },
                        data: {}
                    },
                    required: ["success", "statusCode", "message"]
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        statusCode: { type: "integer", example: 400 },
                        message: { type: "string", example: "Invalid payload received" },
                        errors: {}
                    },
                    required: ["success", "statusCode", "message"]
                },
                UserProfileResponse: {
                    allOf: [
                        { $ref: "#/components/schemas/ApiResponse" },
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer" },
                                        name: { type: "string" },
                                        email: { type: "string", format: "email" },
                                        avatar_url: { type: "string", format: "uri", nullable: true }
                                    }
                                }
                            }
                        }
                    ]
                },
                RegisterAppRequest: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "website_url"],
                    properties: {
                        name: { type: "string", minLength: 3, example: "My Website" },
                        website_url: { type: "string", format: "uri", example: "https://example.com" }
                    }
                },
                RevokeApiKeyRequest: {
                    type: "object",
                    additionalProperties: false,
                    required: ["app_id", "key_id"],
                    properties: {
                        app_id: { type: "integer", minimum: 1, example: 12 },
                        key_id: { type: "integer", minimum: 1, example: 34 }
                    }
                },
                ActiveApiKeysResponse: {
                    allOf: [
                        { $ref: "#/components/schemas/ApiResponse" },
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "integer" },
                                            app_id: { type: "integer" },
                                            is_active: { type: "boolean" },
                                            expires_at: { type: "string", format: "date-time" },
                                            api_key: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                EventRequest: {
                    type: "object",
                    required: ["event", "url", "device", "ipAddress", "timestamp", "metadata", "userId"],
                    properties: {
                        event: { type: "string", minLength: 2, example: "PAGE_VIEW" },
                        url: { type: "string", format: "uri", example: "https://example.com/products" },
                        referrer: { type: "string", format: "uri", nullable: true },
                        device: { type: "string", enum: ["MOBILE", "DESKTOP", "TABLET", "UNKNOWN"], example: "DESKTOP" },
                        ipAddress: { type: "string", format: "ipv4", example: "203.0.113.10" },
                        timestamp: { type: "string", format: "date-time", example: "2026-11-09T12:00:00.000Z" },
                        metadata: {
                            type: "object",
                            required: ["browser", "os", "screenSize"],
                            properties: {
                                browser: { type: "string", minLength: 3, example: "Chrome" },
                                os: { type: "string", minLength: 1, example: "Windows" },
                                screenSize: { type: "string", example: "1920x1080" }
                            }
                        },
                        userId: { type: "string", minLength: 1, example: "user-123" }
                    }
                },
                EventSummaryRequest: {
                    type: "object",
                    additionalProperties: false,
                    required: ["event"],
                    properties: {
                        event: { type: "string", minLength: 2, example: "PAGE_VIEW" },
                        startDate: { type: "string", format: "date", example: "2026-11-01" },
                        endDate: { type: "string", format: "date", example: "2026-11-09" },
                        app_id: { type: "integer", minimum: 1, example: 12 }
                    }
                },
                EventSummaryResponse: {
                    allOf: [
                        { $ref: "#/components/schemas/ApiResponse" },
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "object",
                                    properties: {
                                        event_name: { type: "string" },
                                        event: { type: "string", nullable: true },
                                        count: { type: "integer" },
                                        uniqueUsers: { type: "integer" },
                                        deviceData: {
                                            type: "object",
                                            additionalProperties: { type: "integer" }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                UserStatsResponse: {
                    allOf: [
                        { $ref: "#/components/schemas/ApiResponse" },
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "object",
                                    properties: {
                                        userId: { type: "string" },
                                        totalEvents: { type: "integer" },
                                        ipAddresses: {
                                            type: "array",
                                            items: { type: "string" }
                                        },
                                        deviceDetails: {
                                            type: "object",
                                            properties: {
                                                browser: {
                                                    type: "array",
                                                    items: { type: "string" }
                                                },
                                                os: {
                                                    type: "array",
                                                    items: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    },
    apis
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
