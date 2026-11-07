import {z} from "zod";

export const registerAppSchema = z.object({
    name: z.string().min(3),
    website_url: z.url()
}).strict();

export const revokeApiSchema = z.object({
    app_id: z.coerce.number().int().positive(),
    key_id: z.coerce.number().int().positive()
}).strict();