import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatDialogProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function AIChatDialog({ projectId, projectTitle, open, setOpen }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = { role: 'user', content: inputValue.trim() } as const;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        projectId,
        message: userMessage.content,
        messageHistory: messages
      };
      
      console.log("Sending request to AI:", payload);
      
      const response = await fetch('/api/ai/project-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.message || 'Failed to get response');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Custom component for styling code blocks
  const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded font-mono text-sm">
      {children}
    </code>
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4">
            <Bot className="w-12 h-12 mb-2 text-blue-500" />
            <h4 className="text-lg font-medium mb-1">Project AI Assistant</h4>
            <p className="mb-2">Ask questions about "{projectTitle}"</p>
            <p className="text-sm">I can help explain concepts and requirements, but I won't provide code solutions</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto'
                    : 'bg-gray-100 dark:bg-slate-800 mr-auto'
                } max-w-[80%]`}
              >
                {message.role === 'user' ? (
                  <div>{message.content}</div>
                ) : (
                  <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-headings:my-1">
                    <ReactMarkdown
                      components={{
                        // Style code elements
                        code: CodeBlock,
                        // Don't allow dangerous HTML
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-md font-bold mt-2 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mt-1 mb-1">{children}</h3>,
                        a: ({ href, children }) => <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">{children}</a>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic my-1">{children}</blockquote>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg mr-auto max-w-[80%]"
              >
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '600ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex gap-2"
        >
          <textarea
            className="flex-1 bg-gray-100 dark:bg-slate-800 border-0 rounded-lg p-3 resize-none max-h-32"
            rows={1}
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg self-end disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  );
}