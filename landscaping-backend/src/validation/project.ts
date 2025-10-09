import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(5000),
  location: z.string().min(2).max(300),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
