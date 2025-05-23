import { useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import AIChatDialog from './ai-chat-dialog';

interface AIChatButtonProps {
  projectId: string;
  projectTitle: string;
}

export default function AIChatButton({ projectId, projectTitle }: AIChatButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed right-6 bottom-24 w-[90vw] max-w-md h-[70vh] bg-white dark:bg-slate-900 rounded-xl shadow-xl flex flex-col overflow-hidden z-50">
            <Dialog.Title className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">✨</span>
                <h3 className="font-medium">Project Assistant</h3>
              </div>
              <Dialog.Close className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </Dialog.Title>
            
            <AIChatDialog 
              projectId={projectId} 
              projectTitle={projectTitle}
              open={open}
              setOpen={setOpen}
            />
          </Dialog.Content>
        </Dialog.Portal>
        
        <Dialog.Trigger asChild>
          <motion.button
            className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-30 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageSquareText className="h-6 w-6" />
          </motion.button>
        </Dialog.Trigger>
      </Dialog.Root>
    </>
  );
} 