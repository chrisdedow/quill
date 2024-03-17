import {
  ReactNode,
  createContext,
  useRef,
  useState,
} from 'react';
import { useToast } from '../ui/use-toast';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/app/_trpc/client';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';

// Define the structure of the context's value, including functions and state variables.
type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

// Create a React context for the chat functionalities.
export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: '',
  handleInputChange: () => {},
  isLoading: false,
});

interface Props {
  userId: string;
  children: ReactNode;
}

// Provides the context for chat functionality, including message sending and state management.
export const ChatContextProvider = ({ userId, children }: Props) => {
  // State for the current message being typed by the user.
  const [message, setMessage] = useState<string>('');

  // const [messages, setMessages] = useState([]);

  // useEffect(() => {
  //   console.log("Messages updated:", messages);
  // }, [messages]); // Dependency array ensures this runs every time `messages` changes.

  // State to indicate if the message sending process is in progress.
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Access TRPC utilities for invoking TRPC queries and mutations.
  const utils = trpc.useContext();

  // Hook for showing toast notifications for various actions and states.
  const { toast } = useToast();
  
  // Initialize with a unique ID upfront
  const ongoingMessageId = useRef<string>(crypto.randomUUID());

  // Ref to store a backup of the current message in case an error occurs during sending.
  const backupMessage = useRef('');

  // Mutation hook for sending a message. This includes lifecycle methods for managing state before, during, and after the message send operation.
  const { mutate: sendMessage } = useMutation({
    // Function to actually send the message to the server.
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/messageChatAssistant', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          // fileId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.body;
    },
    // Lifecycle method called immediately before the mutation function. Used to optimistically update the UI and prepare for sending the message.
    onMutate: async ({ message }) => {
      // Store the current message in case we need to revert.
      backupMessage.current = message;
      // Clear the message input field to prepare for the next message.
      setMessage('');

      // Cancel any ongoing fetches for user messages to avoid conflicts.
      await utils.getUserMessages.cancel();

      // Get the current state of user messages.
      const previousMessages = utils.getUserMessages.getInfiniteData();

      // Optimistically update the UI to include the new message.
      utils.getUserMessages.setInfiniteData({ limit: INFINITE_QUERY_LIMIT }, (old) => {
        if (!old) {
          return { pages: [], pageParams: [] };
        }

        let newPages = [...old.pages];
        let latestPage = newPages[0]!;
        latestPage.messages = [{ 
          createdAt: new Date().toISOString(), 
          id: crypto.randomUUID(), 
          text: message, 
          isUserMessage: true 
        }, ...latestPage.messages];
        newPages[0] = latestPage;

        return { ...old, pages: newPages };
      });

      setIsLoading(true);

      return { previousMessages: previousMessages?.pages.flatMap((page) => page.messages) ?? [] };
    },
  
    // Lifecycle method called when the mutation is successful. Used to handle the response and update the UI accordingly.
    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream) {
        toast({
          title: 'There was a problem sending this message',
          description: 'Please refresh this page and try again',
          variant: 'destructive',
        });
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accResponse = '';
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        accResponse += decoder.decode(value);

        if (!ongoingMessageId.current) {
          ongoingMessageId.current = crypto.randomUUID();
        }

        utils.getUserMessages.setInfiniteData({ limit: INFINITE_QUERY_LIMIT }, (old) => {
          if (!old) return { pages: [], pageParams: [] };

          let updatedPages = old.pages.map((page) => {
            if (page === old.pages[0]) {
              let updatedMessages = page.messages.map((msg) => 
                msg.id === ongoingMessageId.current ? { ...msg, text: accResponse } : msg
              );

              if (!updatedMessages.some(msg => msg.id === ongoingMessageId.current)) {
                updatedMessages = [{ createdAt: new Date().toISOString(), id: ongoingMessageId.current, text: accResponse, isUserMessage: false }, ...updatedMessages];
              }

              return { ...page, messages: updatedMessages };
            }
            return page;
          });

          return { ...old, pages: updatedPages };
        });
      }

      // Reset ongoingMessageId after the stream is complete
      ongoingMessageId.current = crypto.randomUUID();
    },
  });

  // Function to handle changes in the message input field.
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Function to initiate the message sending process.
  const addMessage = () => sendMessage({ message });

  // Provide the context value to components within this provider.
  return (
    <ChatContext.Provider value={{ addMessage, message, handleInputChange, isLoading }}>
      {children}
    </ChatContext.Provider>
  );
};
