import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLLM } from '../models/llm.js';
import { mbsVectorStore } from '../services/mbsVectorStore.js';
import type { BillingOpportunityOutput, BillingOpportunity, OpportunityType } from '../types/mbs.js';

/**
 * Billing Opportunity Tool
 * 
 * Analyzes consultation notes against MBS item rules to identify
 * missed billing opportunities using LLM-based pattern recognition.
 * 
 * Input: Consultation notes, optional already-billed codes, patient context
 * Output: Flagged missed opportunities with reasoning and recommendations
 */

export const billingOpportunityTool: StructuredTool = new (DynamicStructuredTool as any)({
  name: 'flag_billing_opportunities',
  description: `Analyzes consultation notes to identify MISSED billing opportunities - procedures, assessments, or management activities that were performed or could be claimed but were not explicitly coded.

Use this tool when you need to audit consultation notes for potential missed revenue or billing opportunities.

The tool will:
- Analyze consultation notes for implicit activities
- Check eligibility for chronic disease management plans
- Identify procedures mentioned but not coded
- Flag health assessment opportunities based on patient age
- Detect mental health treatment opportunities
- Suggest consultation level upgrades based on duration/complexity

Input can include:
- Consultation notes (required)
- Already suggested/billed codes (optional - to avoid duplicates)
- Patient age (optional - for age-based assessments)
- Consultation duration (optional - for level upgrades)`,

  schema: z.object({
    consultationNotes: z.string().describe('Consultation notes to analyze for missed billing opportunities'),
    suggestedCodes: z.array(z.string()).optional().describe('Optional: MBS item numbers already suggested or billed (to avoid duplicates)'),
    patientAge: z.number().optional().describe('Optional: Patient age in years (for age-based health assessments)'),
    consultationDuration: z.string().optional().describe('Optional: Duration of consultation (e.g., "20 minutes", "45 minutes")'),
  }),

  func: async (input: { 
    consultationNotes: string; 
    suggestedCodes?: string[]; 
    patientAge?: number; 
    consultationDuration?: string;
  }) => {
    const { consultationNotes, suggestedCodes, patientAge, consultationDuration } = input;

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
      console.log('🔍 Searching for relevant MBS codes for opportunity detection...');
      const relevantCodesContext = await mbsVectorStore.getContextForPrompt(
        consultationNotes,
        15 // Get top 15 relevant codes for broader context
      );

      // Step 2: Build prompt for LLM
      const llm = createLLM();
      const prompt = buildBillingOpportunityPrompt(
        consultationNotes,
        relevantCodesContext,
        suggestedCodes,
        patientAge,
        consultationDuration
      );

      console.log('🤖 Requesting LLM billing opportunity analysis...');

      // Step 3: Get analysis from LLM
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
      const output = parseLLMResponse(llmResponse, suggestedCodes);

      // Step 5: Format for display
      return formatBillingOpportunityOutput(output, consultationNotes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error analyzing billing opportunities:', errorMessage);
      return JSON.stringify({
        error: `Error analyzing billing opportunities: ${errorMessage}`,
      });
    }
  },
});

/**
 * Build prompt for billing opportunity detection
 */
function buildBillingOpportunityPrompt(
  notes: string,
  relevantCodes: string,
  suggestedCodes?: string[],
  patientAge?: number,
  duration?: string
): string {
  const alreadyBilledSection = suggestedCodes && suggestedCodes.length > 0
    ? `**Already Suggested/Billed Codes:**\n${suggestedCodes.join(', ')}\n\n**IMPORTANT:** Do NOT suggest any codes that are already in the above list. Only flag NEW opportunities.\n\n`
    : '**Already Suggested/Billed Codes:** None provided\n\n';

  return `You are a medical billing auditor specializing in Australian Medicare Benefits Schedule (MBS) codes.

**Your Task:**
Analyze the consultation notes to identify MISSED billing opportunities - procedures, assessments, or management activities that were performed or could be claimed but were NOT explicitly coded or mentioned.

**Instructions:**
1. Look for IMPLICIT activities and opportunities:
   - "Discussed medication changes" → Could indicate chronic disease management
   - "Ongoing care" → Could indicate care plan eligibility
   - "Performed heart check" → Could indicate ECG (even if not explicitly stated)
   - "Breathing test" → Could indicate spirometry
   - Multiple chronic conditions mentioned → GP Management Plan opportunity
   - Mental health keywords (depression, anxiety) → Mental Health Treatment Plan
   
2. Check ELIGIBILITY criteria:
   - Patient age 45-49 or 75+ → Health assessment opportunity
   - Consultation duration suggests higher level than documented
   - After-hours timing mentioned
   
3. Consider SIMPLIFIED MBS RULES:
   - Chronic Disease Management: 2+ chronic conditions OR keywords like "care plan", "ongoing management"
   - Health Assessments: Age-based (45-49, 75+)
   - Procedures: Any mention of tests/procedures (ECG, spirometry, wound care)
   - Consultation Upgrades: Duration thresholds (20min=Level B, 40min=Level C, 60min=Level D)
   - Mental Health: Keywords like "depression", "anxiety", "mental health"
   - After Hours: Keywords like "evening", "weekend", "after hours"

4. Provide 2-5 HIGH-VALUE opportunities (prioritize highest potential revenue)

5. For each opportunity, be SPECIFIC about:
   - Why it applies (clear reasoning)
   - What documentation is needed to claim it
   - Confidence level (high/medium/low)

**Consultation Notes:**
${notes}

${alreadyBilledSection}**Patient Context:**
- Age: ${patientAge ? `${patientAge} years` : 'Not specified'}
- Duration: ${duration || 'Not specified'}

**Relevant MBS Codes for Reference:**
${relevantCodes}

**Format your response EXACTLY as follows (use this exact format for each opportunity):**

OPPORTUNITY: [item number]
TYPE: [chronic_disease_plan/health_assessment/procedure/consultation_upgrade/mental_health/after_hours]
DESCRIPTION: [brief description of the MBS item]
CONFIDENCE: [high/medium/low]
FEE: [fee amount with $ symbol]
REASONING: [clear explanation of why this opportunity exists based on the notes]
REQUIREMENTS: [what needs to be documented or verified to claim this code]
---

**Your Analysis:**`;
}

/**
 * Parse LLM response into structured output
 */
function parseLLMResponse(response: string, suggestedCodes?: string[]): BillingOpportunityOutput {
  const opportunities: BillingOpportunity[] = [];
  
  // Parse opportunity blocks
  const opportunityBlocks = response.split('---').filter(block => block.trim());
  
  for (const block of opportunityBlocks) {
    const itemMatch = block.match(/OPPORTUNITY:\s*(\d+)/i);
    const typeMatch = block.match(/TYPE:\s*(chronic_disease_plan|health_assessment|procedure|consultation_upgrade|mental_health|after_hours)/i);
    const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?=CONFIDENCE:|$)/is);
    const confMatch = block.match(/CONFIDENCE:\s*(high|medium|low)/i);
    const feeMatch = block.match(/FEE:\s*(\$[\d.]+)/i);
    const reasonMatch = block.match(/REASONING:\s*(.+?)(?=REQUIREMENTS:|$)/is);
    const reqMatch = block.match(/REQUIREMENTS:\s*(.+?)(?=OPPORTUNITY:|$)/is);

    if (itemMatch && typeMatch && descMatch && confMatch && feeMatch && reasonMatch && reqMatch) {
      const itemNumber = itemMatch[1];
      
      // Skip if already in suggested codes
      if (suggestedCodes && suggestedCodes.includes(itemNumber)) {
        console.log(`⏭️  Skipping item ${itemNumber} - already suggested`);
        continue;
      }

      opportunities.push({
        code: {
          itemNumber,
          description: descMatch[1].trim(),
          category: 'consultation', // Simplified for demo
          keywords: [],
          typicalConditions: [],
          fee: feeMatch[1],
        },
        opportunityType: typeMatch[1] as OpportunityType,
        reasoning: reasonMatch[1].trim(),
        confidence: confMatch[1].toLowerCase() as 'high' | 'medium' | 'low',
        potentialFee: feeMatch[1],
        requirements: reqMatch[1].trim(),
      });
    }
  }

  // Calculate summary
  const highConfidenceCount = opportunities.filter(o => o.confidence === 'high').length;
  const totalRevenue = opportunities.reduce((sum, opp) => {
    const fee = parseFloat(opp.potentialFee.replace('$', ''));
    return sum + (isNaN(fee) ? 0 : fee);
  }, 0);

  // Generate recommendations
  const recommendations: string[] = [];
  if (opportunities.length > 0) {
    recommendations.push('Review the flagged opportunities and verify if the activities were actually performed.');
    
    const hasHighConfidence = opportunities.some(o => o.confidence === 'high');
    if (hasHighConfidence) {
      recommendations.push('High-confidence opportunities should be prioritized for review and documentation.');
    }
    
    const hasChronic = opportunities.some(o => o.opportunityType === 'chronic_disease_plan');
    if (hasChronic) {
      recommendations.push('Consider creating formal GP Management Plans or Team Care Arrangements for patients with multiple chronic conditions.');
    }
    
    const hasProcedure = opportunities.some(o => o.opportunityType === 'procedure');
    if (hasProcedure) {
      recommendations.push('Ensure all procedures performed are documented and coded appropriately.');
    }
  } else {
    recommendations.push('No missed opportunities detected. The consultation appears to be comprehensively coded.');
  }

  return {
    missedOpportunities: opportunities,
    summary: {
      totalOpportunities: opportunities.length,
      potentialAdditionalRevenue: `$${totalRevenue.toFixed(2)}`,
      highConfidenceCount,
    },
    recommendations,
  };
}

/**
 * Format output for display
 */
function formatBillingOpportunityOutput(output: BillingOpportunityOutput, originalNotes: string): string {
  const { missedOpportunities, summary, recommendations } = output;

  let result = `## 💰 Billing Opportunity Analysis\n\n`;

  // Summary
  result += `**Summary:**\n`;
  result += `- Total missed opportunities: ${summary.totalOpportunities}\n`;
  result += `- High confidence opportunities: ${summary.highConfidenceCount}\n`;
  result += `- Potential additional revenue: ${summary.potentialAdditionalRevenue}\n\n`;

  // Opportunities
  if (missedOpportunities.length > 0) {
    result += `**🚩 Flagged Opportunities:**\n\n`;
    
    missedOpportunities.forEach((opp, index) => {
      const confidenceEmoji = opp.confidence === 'high' ? '🟢' : opp.confidence === 'medium' ? '🟡' : '🔴';
      const typeEmoji = getTypeEmoji(opp.opportunityType);
      
      result += `${index + 1}. **Item ${opp.code.itemNumber}** - ${opp.code.description}\n`;
      result += `   ${typeEmoji} Type: ${formatOpportunityType(opp.opportunityType)}\n`;
      result += `   ${confidenceEmoji} Confidence: ${opp.confidence.toUpperCase()}\n`;
      result += `   💵 Potential Fee: ${opp.potentialFee}\n`;
      result += `   💡 Reasoning: ${opp.reasoning}\n`;
      result += `   📋 Requirements: ${opp.requirements}\n\n`;
    });
  } else {
    result += `**✅ No Missed Opportunities Detected**\n\n`;
    result += `The consultation appears to be comprehensively coded. All billable activities seem to be accounted for.\n\n`;
  }

  // Recommendations
  if (recommendations.length > 0) {
    result += `**📌 Recommendations:**\n`;
    recommendations.forEach((rec, index) => {
      result += `${index + 1}. ${rec}\n`;
    });
    result += `\n`;
  }

  // Original notes reference
  result += `**📝 Analyzed consultation notes:**\n\`\`\`\n${originalNotes.substring(0, 300)}${originalNotes.length > 300 ? '...' : ''}\n\`\`\`\n\n`;

  result += `---\n`;
  result += `💡 **Note:** These are potential opportunities based on AI analysis. Always verify clinical accuracy and documentation requirements before billing.`;

  return result;
}

/**
 * Get emoji for opportunity type
 */
function getTypeEmoji(type: OpportunityType): string {
  const emojiMap: Record<OpportunityType, string> = {
    chronic_disease_plan: '🏥',
    health_assessment: '🩺',
    procedure: '🔬',
    consultation_upgrade: '⬆️',
    mental_health: '🧠',
    after_hours: '🌙',
  };
  return emojiMap[type] || '📋';
}

/**
 * Format opportunity type for display
 */
function formatOpportunityType(type: OpportunityType): string {
  const typeMap: Record<OpportunityType, string> = {
    chronic_disease_plan: 'Chronic Disease Management',
    health_assessment: 'Health Assessment',
    procedure: 'Procedure',
    consultation_upgrade: 'Consultation Level Upgrade',
    mental_health: 'Mental Health',
    after_hours: 'After Hours',
  };
  return typeMap[type] || type;
}
