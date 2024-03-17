import { db } from '@/db';
import { openai } from '@/lib/openai';
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextRequest } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai'; // Assuming correct import

export const POST = async (req: NextRequest) => {
    const body = await req.json();
    console.log('Request body:', body); // After parsing the request body
    const { getUser } = getKindeServerSession();
    const user = getUser();
    console.log('Authenticated user:', user); // After retrieving the user


  const { id: userId } = user;

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message } = SendMessageValidator.parse(body);
  console.log('Message to save:', message); // Before saving the incoming message

  // Save the incoming user message
  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      fileId: null,
      userId
      
    },
  }).then(() => console.log('Message saved successfully')).catch((error) => console.error('Error saving message:', error)); // After saving the incoming user message

  // Fetch recent messages for context
  console.log('Fetching last 6 messages for context'); // Before fetching recent messages
  
  // Fetch the last 6 messages for context in descending order
  const prevMessagesDesc = await db.message.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  });

  // Since we fetched the messages in descending order to get the last 6,
  // we reverse them to present in ascending order for reading comprehension.
  const prevMessages = prevMessagesDesc.reverse();

  console.log('Fetched and reversed messages:', prevMessages);

  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage
      ? ('user' as const)
      : ('assistant' as const),
    content: msg.text,
  }));

  // After fetching and formatting previous messages
  console.log('Formatted previous messages to send to OpenAI:', formattedPrevMessages);

  const system_content = `You are a helpful Portuguese tutor who also speaks English, tasked with guiding students towards conversational fluency.
  Your primary goal is to engage the student in mastering 3,000 of the most common words in Portuguese, focusing on practical usage and comprehension.
  Interact with the student by incorporating context from previous conversations or relevant scenarios to make learning more relatable and effective.
  Encourage active participation by asking open-ended questions, initiating dialogues, and providing exercises that challenge the student to use new vocabulary in sentences.
  Adapt your teaching strategy based on the student's progress, offering personalized feedback and suggestions to improve their conversational skills.
  Motivate the student by acknowledging their achievements and progress, reinforcing their confidence in using Portuguese in real-life situations.
  If unsure about a question, be honest and suggest looking up the answer together, fostering a collaborative learning environment.`;

  // console.log(content);

  // Send the user message to OpenAI for processing
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    stream: true,
    messages: [
      {
        role: 'system',
        content: system_content,
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === 'user')
      return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  USER INPUT: ${message}`,
      },
    ],
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      // Inside the onCompletion handler
      console.log('Bot completion:', completion); // Log the completion object

      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId: null,
          userId,
        },
      }).then(() => console.log('Bot response saved successfully'))
        .catch((error) => console.error('Error saving bot response:', error));;
    },
  });

  return new StreamingTextResponse(stream);
}
