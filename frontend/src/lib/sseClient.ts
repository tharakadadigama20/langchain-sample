/**
 * SSE Client Utility
 * Handles Server-Sent Events connection and parsing
 */

export interface SSEEvent {
  type: string;
  data: string;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: string) => void>> = new Map();

  /**
   * Connect to SSE endpoint
   */
  connect(url: string, body: Record<string, unknown>) {
    // Close existing connection (but don't clear listeners - they're set up before connect)
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Create EventSource-like connection using fetch
    // Note: EventSource doesn't support POST, so we use fetch with ReadableStream
    return this.connectWithFetch(url, body);
  }

  private async connectWithFetch(url: string, body: Record<string, unknown>) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = 'message';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            this.emit('done', '');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) {
              continue;
            }
            
            if (trimmedLine.startsWith('event: ')) {
              currentEventType = trimmedLine.substring(7).trim();
            } else if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.substring(6);
              // Handle empty data objects like "{}"
              if (data.trim() === '{}') {
                // Emit empty string for done events
                if (currentEventType === 'done') {
                  this.emit(currentEventType, '');
                }
              } else {
                // Emit the event with data
                this.emit(currentEventType, data);
              }
            }
          }
        }
      };

      processStream().catch((error) => {
        this.emit('error', JSON.stringify({ error: error.message }));
      });
    } catch (error) {
      this.emit('error', JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  /**
   * Listen to SSE events
   */
  on(event: string, callback: (data: string) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: string) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: string) {
    console.log(`[SSE] Event: ${event}, Data:`, data.substring(0, 50)); // Debug log
    const listeners = this.listeners.get(event);
    console.log(`[SSE] Listeners for ${event}:`, listeners?.size || 0); // Debug log
    listeners?.forEach((callback) => {
      try {
        console.log(`[SSE] Calling callback for ${event}`); // Debug log
        callback(data);
      } catch (error) {
        console.error('Error in SSE event listener:', error);
      }
    });
  }

  /**
   * Close SSE connection
   */
  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    // Don't clear listeners here - they might still be needed
    // Only clear on explicit cleanup
  }
  
  /**
   * Clear all listeners (for cleanup)
   */
  clearListeners() {
    this.listeners.clear();
  }
}

