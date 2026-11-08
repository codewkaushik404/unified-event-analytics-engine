import {z} from "zod";

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
        .pipe(z.enum(["MOBILE", "DESKTOP", "TABLET", "UNKNOWN"])),
    ipAddress: z.union([z.ipv4(), z.ipv6()]),
    timestamp: z.iso.datetime(),
    metadata: z.object({
        browser: z.string().min(3).transform((value) => value.toLowerCase()),
        os: z.string().min(1),
        screenSize: z.string()
    }),

    userId: z.string().min(1)
});

export const eventSummarySchema = z.object({
    event: z.string().min(2),
    startDate: z.iso.date().transform((date) => new Date(date)).optional(),
    endDate: z.iso.date().transform((date) => new Date(date)).optional(),
    app_id: z.coerce.number().int().positive().optional()
})
.strict()
.refine((data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.startDate <= data.endDate;
}, {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"]
});

export const userStatsSchema = z.object({
    userId: z.string().min(1)
}).strict();