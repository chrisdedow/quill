import { trpc } from '@/app/_trpc/client';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { Loader2, MessageSquare } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import Message from './Message';
import { useContext, useEffect, useRef } from 'react';
import { ChatContext } from './ChatContext';
import { useIntersection } from '@mantine/hooks';

interface MessagesProps {
  userId: string
}

const Messages = ({ userId }: MessagesProps) => {
  const { isLoading: isAiThinking } =
    useContext(ChatContext)

  const { data, isLoading, fetchNextPage } =
    trpc.getUserMessages.useInfiniteQuery(
      {
        userId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage?.nextCursor,
        keepPreviousData: true,
      }
    );

  const messages = data?.pages.flatMap((page) => page.messages) ?? [];
  const loadingMessage = isAiThinking ? [{
    createdAt: new Date().toISOString(),
    id: 'loading-message',
    isUserMessage: false,
    text: 'Thinking...',
  }] : [];

  // Combined messages with potential loading indicator
  const combinedMessages = [...messages, ...loadingMessage];

  // Intersection observer for infinite scrolling
  const {ref, entry} = useIntersection({ threshold: 1 });
  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  // Render individual message
  const renderMessage = (message, i) => {
    const isNextMessageSamePerson = combinedMessages[i + 1]?.isUserMessage === message.isUserMessage;
    const isLastMessage = i === combinedMessages.length - 1;
    const key = message.id || `loading-${i}`;

    return (
      <Message
        ref={isLastMessage ? ref : undefined}
        message={message}
        isNextMessageSamePerson={isNextMessageSamePerson}
        key={key}
      />
    );
  };

  return (
    <div className='flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
      {isLoading ? (
        <div className='w-full flex flex-col gap-2'>
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
        </div>
      ) : combinedMessages.length > 0 ? (
        combinedMessages.map(renderMessage)
      ) : (
        <div className='flex-1 flex flex-col items-center justify-center gap-2'>
          <MessageSquare className='h-8 w-8 text-blue-500' />
          <h3 className='font-semibold text-xl'>You&apos;re all set!</h3>
          <p className='text-zinc-500 text-sm'>Ask your first question to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Messages;

// import { trpc } from '@/app/_trpc/client';
// import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
// import { Loader2, MessageSquare } from 'lucide-react';
// import Skeleton from 'react-loading-skeleton';
// import Message from './Message';
// import { useContext, useEffect, useRef } from 'react';
// import { ChatContext } from './ChatContext';
// import { useIntersection } from '@mantine/hooks';

// interface MessagesProps {
//   userId: string
// }

// const Messages = ({ userId }: MessagesProps) => {
//   const { isLoading: isAiThinking } =
//     useContext(ChatContext)

//   const { data, isLoading, fetchNextPage } =
//     trpc.getUserMessages.useInfiniteQuery(
//       {
//         userId,
//         limit: INFINITE_QUERY_LIMIT,
//       },
//       {
//         getNextPageParam: (lastPage) =>
//           lastPage?.nextCursor,
//         keepPreviousData: true,
//       }
//     );

//   const messages = data?.pages.flatMap((page) => page.messages);

//   const loadingMessage = {
//     createdAt: new Date().toISOString(),
//     id: 'loading-message',
//     isUserMessage: false,
//     text: (
//       <span className='flex h-full items-center justify-center'>
//         <Loader2 className='h-4 w-4 animate-spin' />
//       </span>
//     ),
//   }

//   const combinedMessages = [
//     ...(isAiThinking ? [loadingMessage] : []),
//     ...(messages ?? []),
//   ]

//   const lastMessageRef = useRef<HTMLDivElement>(null)

//   const { ref, entry } = useIntersection({
//     root: lastMessageRef.current,
//     threshold: 1,
//   })

//   useEffect(() => {
//     if (entry?.isIntersecting) {
//       fetchNextPage()
//     }
//   }, [entry, fetchNextPage])

//   return (
//     <div className='flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'>
//       {combinedMessages && combinedMessages.length > 0 ? (
//         combinedMessages.map((message, i) => {
//           const isNextMessageSamePerson =
//             combinedMessages[i - 1]?.isUserMessage ===
//             combinedMessages[i]?.isUserMessage

//           if (i === combinedMessages.length - 1) {
//             return (
//               <Message
//                 ref={ref}
//                 message={message}
//                 isNextMessageSamePerson={
//                   isNextMessageSamePerson
//                 }
//                 key={message.id}
//               />
//             )
//           } else
//             return (
//               <Message
//                 message={message}
//                 isNextMessageSamePerson={
//                   isNextMessageSamePerson
//                 }
//                 key={message.id}
//               />
//             )
//         })
//       ) : isLoading ? (
//         <div className='w-full flex flex-col gap-2'>
//           <Skeleton className='h-16' />
//           <Skeleton className='h-16' />
//           <Skeleton className='h-16' />
//           <Skeleton className='h-16' />
//         </div>
//       ) : (
//         <div className='flex-1 flex flex-col items-center justify-center gap-2'>
//           <MessageSquare className='h-8 w-8 text-blue-500' />
//           <h3 className='font-semibold text-xl'>
//             You&apos;re all set!
//           </h3>
//           <p className='text-zinc-500 text-sm'>
//             Ask your first question to get started.
//           </p>
//         </div>
//       )}
//     </div>
//   )
// };

// export default Messages;
