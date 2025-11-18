// @ts-ignore - react-markdown types may need TypeScript server restart
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
import type { Message } from '../hooks/useChatStream';
import type { ReactNode } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const markdownComponents = {
    // Style markdown elements
    p: ({ children }: { children?: ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }: { children?: ReactNode }) => <li className="ml-2">{children}</li>,
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-300 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
      ) : (
        <code className="block bg-gray-300 p-2 rounded text-sm font-mono overflow-x-auto">{children}</code>
      );
    },
    h1: ({ children }: { children?: ReactNode }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
    h2: ({ children }: { children?: ReactNode }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
    h3: ({ children }: { children?: ReactNode }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-4 border-gray-400 pl-4 italic my-2">{children}</blockquote>
    ),
  };

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-900'
        }`}
      >
        <div className="prose prose-sm max-w-none break-words">
          {message.content ? (
            isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )
          ) : (
            <span className="text-gray-500 italic">Thinking...</span>
          )}
        </div>
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

