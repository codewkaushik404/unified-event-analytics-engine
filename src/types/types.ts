import {string, z} from "zod";

export const registerAppSchema = z.object({
    name: z.string().min(3),
    website_url: z.url()
}).strict();

export const revokeApiSchema = z.object({
    app_id: z.coerce.number().int().positive(),
    key_id: z.coerce.number().int().positive()
}).strict();

export const eventSchema = z.object({
    event: z.string().min(2),
    url: z.url(),
    referrer: z.url().nullish(), //supports both null and undefined
    device: z.string()
        .transform((value) => value.toUpperCase())
        .pipe(z.enum(["MOBILE", "DESKTOP", "LAPTOP", "UNKNOWN"])),
    ipAddress: z.union([z.ipv4(), z.ipv6()]),
    timestamp: z.iso.datetime(),
    metadata: z.object({
        browser: z.string().min(3).transform((value) => value.toLowerCase()),
        os: z.string().min(1),
        screenSize: z.string()
    }),

    userId: z.string().min(1)
});