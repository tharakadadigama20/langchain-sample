import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Calculator tool for performing mathematical calculations
 */
export const calculationTool = new DynamicStructuredTool({
  name: 'calculator',
  description:
    'Performs mathematical calculations. Input should be a valid mathematical expression that can be evaluated safely.',
  schema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")'),
  }),
  func: async ({ expression }: { expression: string }) => {
    try {
      // Sanitize: Only allow numbers, operators, parentheses, and spaces
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      // Use Function constructor for safe evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        return `Error: Invalid calculation result`;
      }
      
      return `Result: ${result}`;
    } catch (error) {
      return `Error calculating "${expression}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

