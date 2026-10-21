import { z } from "zod";
export const fileAssociation = {
  caseId: z.string().uuid().nullable().optional(),
  treatmentId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  sessionName: z.string().max(120).optional(),
};