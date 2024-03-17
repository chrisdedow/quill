// 'use client'
// // chris created this file
// chris fixed this file
// import { useState } from 'react'
// import {
//   Dialog,
//   DialogContent,
//   DialogTrigger,
// } from './ui/dialog'
// import { Button } from './ui/button'

// import Dropzone from 'react-dropzone'
// import { Cloud, File, Loader2 } from 'lucide-react'
// import { Progress } from './ui/progress'
// import { useUploadThing } from '@/lib/uploadthing'
// import { useToast } from './ui/use-toast'
// import { trpc } from '@/app/_trpc/client'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// const ChatButton = ({
//   isSubscribed,
// }: {
//   isSubscribed: boolean
// }) => {
//   const router = useRouter()

//   const handleClick = () => {
//     if (isSubscribed) {
//       router.push('/')
//     }
//   }

//   return (
//     <>
//       {/* <UploadButton isSubscribed={isSubscribed} /> */}
//       <Button onClick={handleClick} type="button">Chat Assistant</Button>
//     </>
//   )
// }

// export default ChatButton

import { useRouter } from 'next/navigation';

const ChatAssistantButton = () => {
  const router = useRouter();

  const navigate = () => {
    router.push('/chatassistant'); // Assuming '/' is the path to your main landing page
  };

  return (
    <button onClick={navigate}>Chat Assistant</button>
  );
};

export default ChatAssistantButton;
