import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLLM } from '../models/llm.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { 
  MedicareReportOutput 
} from '../types/mbs.js';

/**
 * Medicare Report Generator Tool
 * 
 * Generates Medicare-compliant PDF reports from minimal consultation data.
 * Uses intelligent defaults for missing fields and LLM for clinical summaries.
 * 
 * Input: Patient name, MBS code, consultation notes (minimal required)
 * Output: PDF report with formatted Medicare claim information
 */

// MBS code database (simplified for demo)
const MBS_CODES: Record<string, { description: string; fee: string }> = {
  '23': { description: 'Professional attendance by a general practitioner at consulting rooms, lasting at least 20 minutes', fee: '$91.80' },
  '36': { description: 'Professional attendance by a general practitioner at consulting rooms, lasting at least 40 minutes', fee: '$150.00' },
  '44': { description: 'Professional attendance by a general practitioner at consulting rooms, lasting at least 60 minutes', fee: '$220.00' },
  '721': { description: 'Health assessment for patients 45-49 years', fee: '$225.00' },
  '10990': { description: 'Telehealth attendance by a general practitioner', fee: '$39.10' },
  '10997': { description: 'Telehealth attendance by a general practitioner, lasting at least 20 minutes', fee: '$91.80' },
};

export const medicareReportTool: StructuredTool = new (DynamicStructuredTool as any)({
  name: 'generate_medicare_report',
  description: `Generates a professional Medicare consultation report in PDF format with a downloadable link.

Use this tool when the user wants to create a Medicare report. The tool is VERY FLEXIBLE and only requires minimal information:

REQUIRED:
- Patient name
- MBS item number (e.g., "23", "36", "721")
- Consultation notes (can be brief, e.g., "cough and fever")

OPTIONAL (will use intelligent defaults if not provided):
- Consultation date (defaults to today)
- Patient date of birth (defaults to placeholder)
- Provider name (defaults to "Dr. Provider")
- Other details

The tool will automatically:
- Look up MBS code descriptions and fees
- Generate professional clinical summaries using AI
- Use today's date if not specified
- Create a downloadable PDF with a clickable link`,

  schema: z.object({
    patientName: z.string().describe('Patient full name'),
    mbsItemNumber: z.string().describe('MBS item number (e.g., "23", "36", "721")'),
    consultationNotes: z.string().describe('Consultation notes, can be brief (e.g., "cough and fever", "back pain")'),
    
    // All optional fields with defaults
    consultationDate: z.string().optional().describe('Date of consultation (defaults to today)'),
    consultationType: z.string().optional().describe('Type of consultation (defaults to "Standard Consultation")'),
    duration: z.string().optional().describe('Duration (defaults to "20 minutes")'),
    patientDOB: z.string().optional().describe('Patient date of birth (defaults to placeholder)'),
    patientMedicareNumber: z.string().optional().describe('Patient Medicare number (optional)'),
    providerName: z.string().optional().describe('Provider/Doctor name (defaults to "Dr. Provider")'),
    providerNumber: z.string().optional().describe('Medicare provider number (optional)'),
  }),

  func: async (input: {
    patientName: string;
    mbsItemNumber: string;
    consultationNotes: string;
    consultationDate?: string;
    consultationType?: string;
    duration?: string;
    patientDOB?: string;
    patientMedicareNumber?: string;
    providerName?: string;
    providerNumber?: string;
  }) => {
    try {
      // Apply intelligent defaults
      const today = new Date().toISOString().split('T')[0];
      const consultationDate = input.consultationDate || today;
      const consultationType = input.consultationType || 'Standard Consultation';
      const duration = input.duration || '20 minutes';
      const patientDOB = input.patientDOB || '1980-01-01';
      const providerName = input.providerName || 'Dr. Provider';

      // Look up MBS code details
      const mbsCode = MBS_CODES[input.mbsItemNumber];
      if (!mbsCode) {
        return JSON.stringify({
          success: false,
          error: `MBS code ${input.mbsItemNumber} not found in database. Available codes: ${Object.keys(MBS_CODES).join(', ')}`,
        });
      }

      console.log('📄 Generating Medicare report...');
      console.log(`   Patient: ${input.patientName}`);
      console.log(`   MBS Code: ${input.mbsItemNumber} - ${mbsCode.description}`);

      // Generate clinical summary using LLM
      console.log('🤖 Generating clinical summary with LLM...');
      const clinicalSummary = await generateClinicalSummary(
        input.consultationNotes,
        consultationType,
        duration
      );

      // Prepare data for PDF
      const reportId = generateReportId();
      const timestamp = new Date().toISOString();

      const sessionData = {
        consultationNotes: input.consultationNotes,
        consultationDate,
        consultationType,
        duration,
      };

      const mbsCodes = [{
        itemNumber: input.mbsItemNumber,
        description: mbsCode.description,
        fee: mbsCode.fee,
      }];

      const patientInfo = {
        name: input.patientName,
        dateOfBirth: patientDOB,
        medicareNumber: input.patientMedicareNumber,
      };

      const providerInfo = {
        name: providerName,
        providerNumber: input.providerNumber,
        specialty: 'General Practice',
      };

      // Generate PDF
      console.log('📝 Creating PDF document...');
      const pdfPath = await generatePDF({
        reportId,
        timestamp,
        sessionData,
        mbsCodes,
        patientInfo,
        providerInfo,
        clinicalSummary,
        totalFee: mbsCode.fee,
      });

      console.log(`✅ Medicare report generated: ${pdfPath}`);

      // Format output
      const output: MedicareReportOutput = {
        success: true,
        pdfPath,
        reportId,
        generatedAt: timestamp,
        summary: {
          totalItems: 1,
          totalFee: mbsCode.fee,
          clinicalSummary: clinicalSummary.substring(0, 200) + '...',
        },
      };

      return formatMedicareReportOutput(output, pdfPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error generating Medicare report:', errorMessage);
      return JSON.stringify({
        success: false,
        error: `Error generating Medicare report: ${errorMessage}`,
      });
    }
  },
});

/**
 * Generate clinical summary using LLM
 */
async function generateClinicalSummary(
  notes: string,
  consultationType: string,
  duration: string
): Promise<string> {
  const llm = createLLM();
  
  const prompt = `You are a medical documentation specialist. Generate a professional, concise clinical summary for a Medicare report.

**Consultation Details:**
- Type: ${consultationType}
- Duration: ${duration}

**Consultation Notes:**
${notes}

**Instructions:**
1. Create a professional clinical summary suitable for Medicare documentation
2. Use proper medical terminology
3. Structure the summary with clear sections: Presenting Complaint, Clinical Findings, Management, and Plan
4. Keep it concise but comprehensive (3-5 paragraphs)
5. Maintain professional medical language
6. Do NOT include any headers or titles, just the summary text
7. If the notes are brief, expand them into a professional medical summary

**Your Clinical Summary:**`;

  const response = await llm.invoke(prompt);
  
  // Extract content
  let summary = '';
  if (typeof response.content === 'string') {
    summary = response.content;
  } else if (Array.isArray(response.content)) {
    summary = response.content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        return '';
      })
      .join(' ');
  }

  return summary.trim();
}

/**
 * Generate unique report ID
 */
function generateReportId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `MED-${timestamp}-${random}`;
}

/**
 * Generate PDF document
 */
async function generatePDF(data: {
  reportId: string;
  timestamp: string;
  sessionData: any;
  mbsCodes: any[];
  patientInfo: any;
  providerInfo: any;
  clinicalSummary: string;
  totalFee: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create reports directory if it doesn't exist
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `medicare_report_${data.reportId}.pdf`;
      const filepath = path.join(reportsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('MEDICARE CONSULTATION REPORT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Report ID: ${data.reportId}`, { align: 'center' });
      doc.text(`Generated: ${new Date(data.timestamp).toLocaleString('en-AU')}`, { align: 'center' });
      doc.moveDown(1);

      // Divider
      doc.strokeColor('#333333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Patient Information Section
      doc.fontSize(14).font('Helvetica-Bold').text('PATIENT INFORMATION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${data.patientInfo.name}`);
      doc.text(`Date of Birth: ${data.patientInfo.dateOfBirth}`);
      if (data.patientInfo.medicareNumber) {
        doc.text(`Medicare Number: ${data.patientInfo.medicareNumber}`);
      }
      doc.moveDown(1);

      // Provider Information Section
      doc.fontSize(14).font('Helvetica-Bold').text('PROVIDER INFORMATION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${data.providerInfo.name}`);
      if (data.providerInfo.providerNumber) {
        doc.text(`Provider Number: ${data.providerInfo.providerNumber}`);
      }
      if (data.providerInfo.specialty) {
        doc.text(`Specialty: ${data.providerInfo.specialty}`);
      }
      doc.moveDown(1);

      // Consultation Details Section
      doc.fontSize(14).font('Helvetica-Bold').text('CONSULTATION DETAILS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Date: ${data.sessionData.consultationDate}`);
      doc.text(`Type: ${data.sessionData.consultationType}`);
      doc.text(`Duration: ${data.sessionData.duration}`);
      doc.moveDown(1);

      // Clinical Summary Section
      doc.fontSize(14).font('Helvetica-Bold').text('CLINICAL SUMMARY', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(data.clinicalSummary, { align: 'justify' });
      doc.moveDown(1);

      // MBS Items Section
      doc.fontSize(14).font('Helvetica-Bold').text('MBS ITEMS CLAIMED', { underline: true });
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Item', 50, tableTop, { width: 60, continued: false });
      doc.text('Description', 120, tableTop, { width: 320, continued: false });
      doc.text('Fee', 450, tableTop, { width: 100, align: 'right', continued: false });
      doc.moveDown(0.3);

      // Table divider
      doc.strokeColor('#333333').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Table rows
      doc.font('Helvetica');
      data.mbsCodes.forEach((code: any) => {
        const rowY = doc.y;
        doc.text(code.itemNumber, 50, rowY, { width: 60, continued: false });
        doc.text(code.description, 120, rowY, { width: 320, continued: false });
        doc.text(code.fee, 450, rowY, { width: 100, align: 'right', continued: false });
        doc.moveDown(0.8);
      });

      // Total
      doc.moveDown(0.3);
      doc.strokeColor('#333333').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 350, doc.y, { width: 100, continued: false });
      doc.text(data.totalFee, 450, doc.y - 12, { width: 100, align: 'right', continued: false });
      doc.moveDown(2);

      // Footer
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
      doc.text('This report is generated for demonstration purposes only.', { align: 'center' });
      doc.text('For production use, ensure compliance with Medicare reporting requirements.', { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format output for display
 */
function formatMedicareReportOutput(output: MedicareReportOutput, pdfPath: string): string {
  // Extract filename from path
  const filename = pdfPath.split('/').pop() || '';
  const downloadUrl = `http://localhost:3001/api/download/report/${filename}`;

  let result = `## 📄 Medicare Report Generated Successfully\n\n`;

  result += `**Report Details:**\n`;
  result += `- Report ID: ${output.reportId}\n`;
  result += `- Generated: ${new Date(output.generatedAt).toLocaleString('en-AU')}\n`;
  result += `- File: \`${filename}\`\n\n`;

  result += `**Summary:**\n`;
  result += `- Total MBS Items: ${output.summary.totalItems}\n`;
  result += `- Total Fee: ${output.summary.totalFee}\n\n`;

  result += `**Clinical Summary (Preview):**\n`;
  result += `${output.summary.clinicalSummary}\n\n`;

  result += `---\n\n`;
  result += `### 📥 Download Your Report\n\n`;
  result += `**Click here to download:** [${filename}](${downloadUrl})\n\n`;
  result += `Or copy this URL: \`${downloadUrl}\`\n\n`;

  result += `**Next Steps:**\n`;
  result += `1. Click the download link above\n`;
  result += `2. Review the PDF report\n`;
  result += `3. Verify all MBS codes and fees are correct\n`;
  result += `4. Use for Medicare claim submission or record-keeping\n\n`;

  result += `---\n`;
  result += `✅ **Report ready for download!**`;

  return result;
}
