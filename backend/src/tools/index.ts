import { calculationTool } from './calculationTool.js';
import { webSearchTool } from './webSearchTool.js';
import { customToolExample } from './customToolExample.js';
import { patientQueryTool } from './patientQueryTool.js';
import { transcriptionCorrectionTool } from './transcriptionCorrectionTool.js';

/**
 * Tool Registry
 * Export all available tools for the agent
 * Future: Can be dynamically loaded or configured via environment variables
 */
export const tools = [
  calculationTool,
  webSearchTool,
  customToolExample,
  patientQueryTool,
  transcriptionCorrectionTool,
];

