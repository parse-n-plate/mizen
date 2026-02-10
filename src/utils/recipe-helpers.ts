import { InstructionStep, RecipeStep } from '@/contexts/RecipeContext';

type RawInstruction = string | InstructionStep | RecipeStep;

// Helper to check if instructions are in RecipeStep format
export function isEnhancedInstructions(instructions: RawInstruction[]): instructions is RecipeStep[] {
  if (instructions.length === 0) return false;
  const first = instructions[0];
  return typeof first === 'object' && first !== null && 'stepNumber' in first && 'instruction' in first;
}

// Convert old format to new format (for migration)
export function migrateInstructionsToSteps(instructions: RawInstruction[]): RecipeStep[] {
  return instructions.map((instruction, index) => {
    if (typeof instruction === 'string') {
      return {
        stepNumber: index + 1,
        instruction,
        ingredientsNeeded: [],
        toolsNeeded: [],
      };
    }

    if ('stepNumber' in instruction && 'instruction' in instruction) {
      return instruction as RecipeStep;
    }

    return {
      stepNumber: index + 1,
      instruction: instruction.detail,
      ingredientsNeeded: instruction.ingredients ?? [],
      toolsNeeded: [],
      timerMinutes: instruction.timeMinutes,
      tips: instruction.tips,
    };
  });
}
