import type { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

/**
 * File Download Routes
 * Serves generated files (PDFs, reports, etc.)
 */
export async function downloadRoute(server: FastifyInstance) {
  // Download Medicare report PDF
  server.get('/api/download/report/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };

    try {
      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return reply.code(400).send({ error: 'Invalid filename' });
      }

      // Construct file path
      const reportsDir = path.join(process.cwd(), 'reports');
      const filepath = path.join(reportsDir, filename);

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Read file
      const fileBuffer = fs.readFileSync(filepath);

      // Set headers for PDF download
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', fileBuffer.length);

      return reply.send(fileBuffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error(`Error downloading file: ${errorMessage}`);
      return reply.code(500).send({ error: 'Error downloading file' });
    }
  });

  // List available reports (optional, for debugging)
  server.get('/api/reports', async (request, reply) => {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        return reply.send({ reports: [] });
      }

      const files = fs.readdirSync(reportsDir);
      const reports = files
        .filter(file => file.endsWith('.pdf'))
        .map(file => {
          const filepath = path.join(reportsDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            downloadUrl: `/api/download/report/${file}`,
          };
        });

      return reply.send({ reports });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error(`Error listing reports: ${errorMessage}`);
      return reply.code(500).send({ error: 'Error listing reports' });
    }
  });
}
