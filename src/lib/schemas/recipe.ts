import { z } from "zod";

export const IngredientSchema = z.object({
  amount: z.string().default(""),
  units: z.string().default(""),
  ingredient: z.string().min(1),
});

export const IngredientGroupSchema = z.object({
  groupName: z.string().min(1),
  ingredients: z.array(IngredientSchema).min(1),
});

export const InstructionStepSchema = z.object({
  title: z.string().optional().default(""),
  detail: z.string().optional().default(""),
  text: z.string().optional(),
  name: z.string().optional(),
  timeMinutes: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
  tips: z.string().optional(),
});

export const CoreRecipeSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  author: z.string().optional(),
  servings: z.union([z.number(), z.string()]).optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  totalTimeMinutes: z.number().optional(),
  ingredients: z.array(IngredientGroupSchema).min(1),
  instructions: z.array(
    z.union([InstructionStepSchema, z.string()])
  ),
});
