import { z } from "zod";

export const chatIdSchema = z.string().min(1).max(128);
export const messageContentSchema = z.object({ content: z.string().trim().min(1).max(4000) });
export const messageCreateSchema = messageContentSchema.extend({
    fileUrl: z.string().url().max(2048).refine((value) => {
        const url = new URL(value);
        return url.protocol === "https:" && (url.hostname === "utfs.io" || url.hostname.endsWith(".ufs.sh"));
    }, "Invalid attachment URL").nullish(),
});
