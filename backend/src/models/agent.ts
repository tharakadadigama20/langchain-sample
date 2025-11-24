import { createLLM } from './llm.js';
import { tools } from '../tools/index.js';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { memory } from './memory.js';
import { env } from '../config/env.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Agent Factory
 * Creates a LangChain agent with tools and memory
 * Uses OpenAI Functions agent for OpenAI, custom executor for Gemini
 */
export async function createAgent(sessionId: string = 'default') {
  const llm = createLLM();
  const provider = env.MODEL_PROVIDER;
  
  // Unified prompt for both providers
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a helpful AI assistant with access to various tools, including patient data query, medical transcription correction, MBS billing code suggestion, and billing opportunity detection capabilities.

You can help users with:
- Answering questions about patient records, medications, conditions, and consultation notes
- Searching patient data using natural language queries
- Providing information about specific patients by name or ID
- Correcting medical transcriptions with proper medical terminology
- Suggesting appropriate MBS (Medicare Benefits Schedule) billing codes for consultations
- Identifying missed billing opportunities from consultation notes

**Patient Data Queries:**
When users ask about patient data, ALWAYS use the query_patient_data tool to retrieve relevant information.
For example:
- If asked "Show me patient P001's conditions", use query_patient_data with query="patient P001 conditions" and patientId="P001"
- If asked "What medications is John Smith taking?", use query_patient_data with query="medications John Smith" and patientName="John Smith"
- If asked "Find diabetic patients", use query_patient_data with query="diabetic patients"

**Medical Transcription Correction:**
When users provide medical transcription text (often with speaker labels like "speaker_01: text"), use the correct_medical_transcription tool.
The tool will:
- Fix medical terminology and jargon
- Correct drug names and procedures
- Preserve speaker labels and formatting
- Track all changes with confidence scores
- Provide side-by-side comparison for review

For example:
- If user provides: "speaker_01: Patient has hyper tension and diabeetus", use correct_medical_transcription
- The tool will correct it to proper medical terminology and show all changes made

**MBS Code Suggestions:**
When users ask for billing codes or provide consultation notes that need coding, use the suggest_mbs_codes tool.
The tool will:
- Analyze consultation notes and conditions
- Suggest appropriate MBS item numbers
- Provide confidence scores and reasoning
- Estimate fees for suggested codes

For example:
- If user provides: "Patient came in for diabetes review, discussed medication changes, 30 minutes", use suggest_mbs_codes
- The tool will suggest appropriate consultation codes and any relevant chronic disease management codes

**Billing Opportunity Detection:**
When users want to audit consultation notes for MISSED billing opportunities, use the flag_billing_opportunities tool.
This is DIFFERENT from suggest_mbs_codes:
- suggest_mbs_codes: Suggests codes for what WAS documented
- flag_billing_opportunities: Identifies what COULD HAVE BEEN billed but wasn't mentioned

The tool will:
- Analyze notes for implicit activities (e.g., "discussed care plan" → chronic disease management opportunity)
- Check eligibility for health assessments, chronic disease plans, procedures
- Flag opportunities with confidence levels and reasoning
- Estimate potential additional revenue
- Provide documentation requirements

For example:
- If user asks: "Are there any missed billing opportunities in this consultation?", use flag_billing_opportunities
- If user provides notes and asks to "audit for missed revenue", use flag_billing_opportunities
- You can also use it AFTER suggest_mbs_codes to find additional opportunities

Always use the appropriate tool to get actual data before answering. Never make up or guess patient information, medical corrections, or billing codes.
Always be concise, helpful, and maintain patient privacy and accuracy.`,
    ],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  if (provider === 'openai') {
    // Use OpenAI Functions agent for OpenAI (works perfectly)
    const llmWithTools = llm.bindTools(tools);
    const agent = await createOpenAIFunctionsAgent({
      llm: llmWithTools,
      tools,
      prompt,
    }) as any;

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      returnIntermediateSteps: false,
      maxIterations: 5,
    }) as any;

    return {
      executor: agentExecutor,
      getHistory: () => memory.getLangChainMessages(sessionId),
      addMessage: (role: 'user' | 'assistant', content: string) => {
        memory.addMessage(sessionId, { role, content, timestamp: new Date() });
      },
    };
  } else {
    // Custom executor for Gemini - manually handle function calls
    const llmWithTools = llm.bindTools(tools);
    
    // Create a tool map for quick lookup
    const toolMap = new Map(tools.map(tool => [tool.name, tool]));

    return {
      executor: {
        invoke: async (
          input: { input: string; chat_history: BaseMessage[] },
          options?: { callbacks?: any }
        ) => {
          const messages: BaseMessage[] = [
            ...input.chat_history,
            new HumanMessage(input.input),
          ];

          let iterations = 0;
          const maxIterations = 5;

          while (iterations < maxIterations) {
            iterations++;
            
            console.log(`[Gemini Executor] Iteration ${iterations}, messages:`, messages.length);
            
            let response: any;
            
            try {
              // Call LLM with tools
              // Note: invoke() doesn't stream, so we'll manually stream the final response
              response = await llmWithTools.invoke(messages, options);
            } catch (error) {
              console.error('[Gemini Executor] Error invoking LLM:', error);
              return {
                output: 'I encountered an error processing your request. Please try again.',
              };
            }
            
            if (!response) {
              console.error('[Gemini Executor] No response from LLM');
              return {
                output: 'I did not receive a response. Please try again.',
              };
            }
            
            console.log('[Gemini Executor] Response type:', typeof response);
            console.log('[Gemini Executor] Response content type:', typeof response?.content);
            console.log('[Gemini Executor] Response keys:', Object.keys(response || {}));
            console.log('[Gemini Executor] Tool calls:', response?.tool_calls?.length || 0);
            console.log('[Gemini Executor] Invalid tool calls:', response?.invalid_tool_calls?.length || 0);

            // Extract content safely
            let responseContent = '';
            const content = response?.content;
            
            if (content === undefined || content === null) {
              responseContent = '';
            } else if (typeof content === 'string') {
              responseContent = content;
            } else if (Array.isArray(content)) {
              // Handle array content (Gemini sometimes returns arrays)
              responseContent = content
                .map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item?.text) return item.text;
                  if (item?.type === 'text' && item.text) return item.text;
                  return JSON.stringify(item);
                })
                .filter((s: string) => s)
                .join(' ');
            } else if (typeof content === 'object') {
              // Try to extract text from object
              if (content.text) {
                responseContent = String(content.text);
              } else {
                responseContent = JSON.stringify(content);
              }
            } else {
              responseContent = String(content);
            }

            // Check for tool calls - Gemini might use tool_calls or invalid_tool_calls
            let toolCalls: any[] = [];
            
            // Check tool_calls first
            if (response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0) {
              toolCalls = response.tool_calls;
            }
            
            // If no valid tool calls, check invalid_tool_calls (Gemini sometimes puts them here)
            if (toolCalls.length === 0 && response.invalid_tool_calls && Array.isArray(response.invalid_tool_calls)) {
              // Try to parse invalid tool calls - they might still be usable
              toolCalls = response.invalid_tool_calls.map((invalid: any) => ({
                name: invalid.name,
                args: typeof invalid.args === 'string' ? JSON.parse(invalid.args) : invalid.args,
              }));
            }
            
            console.log('[Gemini Executor] Found tool calls:', toolCalls.length);
            console.log('[Gemini Executor] Response content length:', responseContent.length);
            console.log('[Gemini Executor] Response content preview:', responseContent.substring(0, 200));
            
            if (toolCalls.length === 0) {
              // No tool calls - this is the final response
              console.log('[Gemini Executor] No tool calls - this is final response');
              console.log('[Gemini Executor] Has callbacks:', !!options?.callbacks);
              console.log('[Gemini Executor] Has handleLLMNewToken:', !!options?.callbacks?.handleLLMNewToken);
              console.log('[Gemini Executor] Response content exists:', !!responseContent);
              
              // Manually stream the response content since invoke() doesn't stream
              if (options?.callbacks?.handleLLMNewToken && responseContent) {
                console.log('[Gemini Executor] Starting to stream final response, length:', responseContent.length);
                try {
                  // Stream character by character for smooth streaming effect
                  for (let i = 0; i < responseContent.length; i++) {
                    await options.callbacks.handleLLMNewToken(responseContent[i]);
                  }
                  console.log('[Gemini Executor] Finished streaming response');
                } catch (streamError) {
                  console.error('[Gemini Executor] Error streaming:', streamError);
                }
              } else {
                console.log('[Gemini Executor] NOT streaming - missing callbacks or content');
                if (!options?.callbacks) console.log('  - No callbacks');
                if (!options?.callbacks?.handleLLMNewToken) console.log('  - No handleLLMNewToken');
                if (!responseContent) console.log('  - No responseContent');
              }
              
              return {
                output: responseContent || 'I apologize, but I could not generate a response.',
              };
            }

            // Execute tools
            const toolResults: BaseMessage[] = [];
            
            for (const toolCall of toolCalls) {
              const toolName = toolCall.name;
              let toolArgs: any;
              
              // Parse args - could be string or object
              if (typeof toolCall.args === 'string') {
                try {
                  toolArgs = JSON.parse(toolCall.args);
                } catch {
                  toolArgs = { query: toolCall.args }; // Fallback
                }
              } else {
                toolArgs = toolCall.args || {};
              }
              
              const tool = toolMap.get(toolName);
              
              console.log(`[Gemini Executor] Executing tool: ${toolName}`, toolArgs);
              
              if (options?.callbacks?.handleToolStart) {
                await options.callbacks.handleToolStart(tool, toolArgs);
              }

              if (tool) {
                try {
                  const result = await tool.invoke(toolArgs);
                  const resultStr = String(result);
                  
                  console.log(`[Gemini Executor] Tool result (first 200 chars):`, resultStr.substring(0, 200));
                  
                  if (options?.callbacks?.handleToolEnd) {
                    await options.callbacks.handleToolEnd(resultStr);
                  }

                  // Gemini doesn't support FunctionMessage with name property
                  // Instead, format as AIMessage with function result in content
                  // Format: ToolName returned: <result>
                  toolResults.push(
                    new AIMessage({
                      content: `Tool ${toolName} returned: ${resultStr}`,
                    })
                  );
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : 'Tool execution failed';
                  console.error(`[Gemini Executor] Tool error:`, errorMsg);
                  toolResults.push(
                    new AIMessage({
                      content: `Tool ${toolName} error: ${errorMsg}`,
                    })
                  );
                }
              } else {
                const errorMsg = `Tool ${toolName} not found`;
                console.error(`[Gemini Executor] ${errorMsg}`);
                toolResults.push(
                  new AIMessage({
                    content: `Tool ${toolName} error: ${errorMsg}`,
                  })
                );
              }
            }

            // Add assistant message and tool results to conversation
            // Create AIMessage from response to ensure proper format
            const aiMessage = new AIMessage({
              content: responseContent || '', // Ensure content is never undefined
              tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            });
            messages.push(aiMessage);
            messages.push(...toolResults);
            
            console.log(`[Gemini Executor] Added ${toolResults.length} tool results, continuing loop...`);
            console.log(`[Gemini Executor] Total messages now: ${messages.length}`);
          }

          // Max iterations reached - return last response
          console.log('[Gemini Executor] Max iterations reached');
          const lastResponse = messages[messages.length - 1];
          const lastContent = lastResponse?.content || '';
          const finalOutput = typeof lastContent === 'string' 
            ? lastContent 
            : JSON.stringify(lastContent);
          
          // Stream the last response if we have it
          if (options?.callbacks?.handleLLMNewToken && finalOutput) {
            console.log('[Gemini Executor] Streaming max iterations response');
            for (let i = 0; i < finalOutput.length; i++) {
              await options.callbacks.handleLLMNewToken(finalOutput[i]);
            }
          }
          
          return {
            output: finalOutput || 'I reached the maximum number of tool calls. Please try a simpler query.',
          };
        },
      },
      getHistory: () => memory.getLangChainMessages(sessionId),
      addMessage: (role: 'user' | 'assistant', content: string) => {
        memory.addMessage(sessionId, { role, content, timestamp: new Date() });
      },
    };
  }
}