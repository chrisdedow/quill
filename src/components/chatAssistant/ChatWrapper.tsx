import React from 'react';
import ChatInput from './ChatInput';
import Messages from './Messages';
import { ChatContextProvider } from './ChatContext';

interface ChatWrapperProps {
  userId: string
  isSubscribed: boolean
}

const ChatWrapper = ({
  userId,
  isSubscribed,
}: ChatWrapperProps) => {
  return (
    <ChatContextProvider userId={userId}>
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 justify-between flex flex-col mb-28'>
          <Messages userId={userId} />
        </div>

        <ChatInput />
      </div>
    </ChatContextProvider>
  )
}

export default ChatWrapper