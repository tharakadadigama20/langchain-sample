import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLLM } from '../models/llm.js';
import { mbsVectorStore } from '../services/mbsVectorStore.js';
import type { MBSCodeOutput, MBSCodeSuggestion } from '../types/mbs.js';

/**
 * MBS Code Selection Tool
 * 
 * Suggests appropriate Medicare Benefits Schedule (MBS) billing codes
 * based on consultation notes and conditions using RAG + LLM approach.
 * 
 * Input: Consultation notes, conditions, procedures mentioned
 * Output: Suggested MBS codes with confidence scores and reasoning
 */

export const mbsCodeTool: StructuredTool = new (DynamicStructuredTool as any)({
  name: 'suggest_mbs_codes',
  description: `Suggests appropriate MBS (Medicare Benefits Schedule) billing codes based on consultation notes and patient conditions.

Use this tool when you need to determine which billing codes apply to a medical consultation.

The tool will:
- Analyze consultation notes and conditions
- Suggest relevant MBS item numbers
- Provide reasoning for each suggestion
- Include confidence scores
- Estimate total fees

Input can be:
- Consultation notes (e.g., "Patient presented with chest pain, performed ECG")
- Conditions discussed (e.g., "Diabetes review, medication adjustment")
- Procedures performed (e.g., "ECG, spirometry")`,

  schema: z.object({
    consultationNotes: z.string().describe('Consultation notes, conditions discussed, or procedures performed'),
    consultationDuration: z.string().optional().describe('Optional: Duration of consultation (e.g., "20 minutes", "45 minutes")'),
    specialty: z.string().optional().describe('Optional: Medical specialty context (e.g., "general practice", "cardiology")'),
  }),

  func: async (input: { consultationNotes: string; consultationDuration?: string; specialty?: string }) => {
    const { consultationNotes, consultationDuration, specialty } = input;

    try {
      // Validate input
      if (!consultationNotes || consultationNotes.trim().length === 0) {
        return JSON.stringify({
          error: 'Consultation notes cannot be empty',
        });
      }

      // Ensure vector store is initialized
      if (!mbsVectorStore.getIsInitialized()) {
        console.log('🔄 Initializing MBS codes vector store...');
        await mbsVectorStore.initialize();
      }

      // Step 1: Get relevant MBS codes using RAG
      console.log('🔍 Searching for relevant MBS codes...');
      const relevantCodesContext = await mbsVectorStore.getContextForPrompt(
        consultationNotes,
        10 // Get top 10 relevant codes
      );

      // Step 2: Build prompt for LLM
      const llm = createLLM();
      const prompt = buildMBSSelectionPrompt(
        consultationNotes,
        relevantCodesContext,
        consultationDuration,
        specialty
      );

      console.log('🤖 Requesting LLM code suggestions...');

      // Step 3: Get suggestions from LLM
      const response = await llm.invoke(prompt);

      // Extract content
      let llmResponse = '';
      if (typeof response.content === 'string') {
        llmResponse = response.content;
      } else if (Array.isArray(response.content)) {
        llmResponse = response.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            return '';
          })
          .join(' ');
      }

      // Step 4: Parse LLM response and format output
      const output = parseLLMResponse(llmResponse);

      // Step 5: Format for display
      return formatMBSOutput(output, consultationNotes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error suggesting MBS codes:', errorMessage);
      return JSON.stringify({
        error: `Error suggesting MBS codes: ${errorMessage}`,
      });
    }
  },
});

/**
 * Build prompt for MBS code selection
 */
function buildMBSSelectionPrompt(
  notes: string,
  relevantCodes: string,
  duration?: string,
  specialty?: string
): string {
  return `You are a medical billing expert specializing in Australian Medicare Benefits Schedule (MBS) codes.

**Your Task:**
Analyze the consultation notes and suggest the most appropriate MBS billing codes.

**Instructions:**
1. Suggest 2-5 relevant MBS codes based on the consultation
2. For each code, provide:
   - Item number
   - Brief description
   - Confidence level (high/medium/low)
   - Clear reasoning for why this code applies
3. Consider consultation duration if provided
4. Prioritize the most relevant codes first

**Consultation Notes:**
${notes}

${duration ? `**Consultation Duration:** ${duration}` : ''}
${specialty ? `**Specialty:** ${specialty}` : ''}

**Relevant MBS Codes for Reference:**
${relevantCodes}

**Format your response as follows:**
For each suggested code, use this exact format:

CODE: [item number]
DESCRIPTION: [description]
CONFIDENCE: [high/medium/low]
REASONING: [why this code applies]
---

**Your Suggestions:**`;
}

/**
 * Parse LLM response into structured output
 */
function parseLLMResponse(response: string): MBSCodeOutput {
  const suggestions: MBSCodeSuggestion[] = [];
  
  // Simple parsing - in production, you'd use more robust parsing
  const codeBlocks = response.split('---').filter(block => block.trim());
  
  for (const block of codeBlocks) {
    const codeMatch = block.match(/CODE:\s*(\d+)/i);
    const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?=CONFIDENCE:|$)/is);
    const confMatch = block.match(/CONFIDENCE:\s*(high|medium|low)/i);
    const reasonMatch = block.match(/REASONING:\s*(.+?)(?=CODE:|$)/is);

    if (codeMatch && descMatch && confMatch && reasonMatch) {
      suggestions.push({
        code: {
          itemNumber: codeMatch[1],
          description: descMatch[1].trim(),
          category: 'consultation', // Simplified for demo
          keywords: [],
          typicalConditions: [],
          fee: '$0.00', // Would be looked up from database
        },
        confidence: confMatch[1].toLowerCase() as 'high' | 'medium' | 'low',
        reasoning: reasonMatch[1].trim(),
        relevanceScore: confMatch[1].toLowerCase() === 'high' ? 0.9 : confMatch[1].toLowerCase() === 'medium' ? 0.6 : 0.3,
      });
    }
  }

  const highConfidence = suggestions.filter(s => s.confidence === 'high').length;

  return {
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      highConfidence,
      estimatedTotalFee: '$0.00', // Would calculate from actual fees
    },
    warnings: suggestions.length === 0 ? ['No MBS codes could be suggested. Please provide more details.'] : undefined,
  };
}

/**
 * Format output for display
 */
function formatMBSOutput(output: MBSCodeOutput, originalNotes: string): string {
  const { suggestions, summary, warnings } = output;

  let result = `## 💳 MBS Code Suggestions\n\n`;

  // Summary
  result += `**Summary:**\n`;
  result += `- Total suggestions: ${summary.totalSuggestions}\n`;
  result += `- High confidence: ${summary.highConfidence}\n\n`;

  // Warnings
  if (warnings && warnings.length > 0) {
    result += `**⚠️ Warnings:**\n`;
    warnings.forEach((warning) => {
      result += `- ${warning}\n`;
    });
    result += `\n`;
  }

  // Suggestions
  if (suggestions.length > 0) {
    result += `**📋 Suggested Codes:**\n\n`;
    suggestions.forEach((suggestion, index) => {
      const confidenceEmoji = suggestion.confidence === 'high' ? '🟢' : suggestion.confidence === 'medium' ? '🟡' : '🔴';
      result += `${index + 1}. **Item ${suggestion.code.itemNumber}** - ${suggestion.code.description}\n`;
      result += `   ${confidenceEmoji} Confidence: ${suggestion.confidence.toUpperCase()}\n`;
      result += `   💡 Reasoning: ${suggestion.reasoning}\n\n`;
    });
  }

  // Original notes reference
  result += `**📝 Based on consultation notes:**\n\`\`\`\n${originalNotes}\n\`\`\`\n\n`;

  result += `---\n`;
  result += `💡 **Tip:** Review all suggestions and verify they match the actual consultation before billing.`;

  return result;
}
