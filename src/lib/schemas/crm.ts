import { z } from "zod";

/**
 * Base Zod Schema for Ecodrix CRM Lead entity.
 * Used internally within API bounds to validate incoming responses or mutation payloads.
 * (Rule #30: Validate inputs at boundaries.)
 */
export const ErixLeadSchema = z.object({
  _id: z.string().min(1, "Lead ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string(),
  email: z.string().email("Invalid email format").optional(),
  status: z.string(),
  source: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  assignedTo: z.string().optional(),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Validation schema for updating a lead's pipeline stage
 * commonly used in drag-and-drop operations on the Kanban board.
 */
export const DragDropStageUpdateSchema = z.object({
  leadId: z.string(),
  fromPipelineId: z.string(),
  fromStageId: z.string(),
  toPipelineId: z.string(),
  toStageId: z.string(),
});
