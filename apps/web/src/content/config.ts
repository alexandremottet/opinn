import { defineCollection, z } from "astro:content";

const dimensionsSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  depthMm: z.number().positive(),
});

const edgeWidthRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  default: z.number().min(0),
  step: z.number().positive().optional(),
});

const cabinetDoorSchema = z.object({
  edgeWidthMm: edgeWidthRangeSchema,
  material: z.string().optional(),
  colorHex: z.string().optional(),
});

const objects = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    kind: z.enum(["cabinet-door", "generic"]),
    summary: z.string(),
    dimensions: dimensionsSchema,
    downloadFile: z.object({
      path: z.string(),
      label: z.string(),
    }),
    modelUrl: z.string().url().optional(),
    cabinetDoor: cabinetDoorSchema.optional(),
  }),
});

export const collections = { objects };
