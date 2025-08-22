import { z } from "zod";

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string().optional(),
  position: z.string().optional(),
  created_at: z.date().optional(),
});

export type Player = z.infer<typeof PlayerSchema>;