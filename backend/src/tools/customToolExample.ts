import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Example custom tool demonstrating the tool design pattern
 * This can be used as a template for creating new tools
 */
export const customToolExample = new DynamicStructuredTool({
  name: 'example_tool',
  description: 'An example tool that demonstrates the tool design pattern. Returns a processed version of the input.',
  schema: z.object({
    query: z.string().describe('Input query to process'),
  }),
  func: async ({ query }: { query: string }) => {
    // Example processing logic
    return `Processed: ${query.toUpperCase()}`;
  },
});

