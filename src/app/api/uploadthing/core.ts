// core.ts
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from "uploadthing/server";

import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { pinecone } from '@/lib/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { PLANS } from '@/config/stripe'

const f = createUploadthing()

const middleware = async () => {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  if (!user || !user.id) throw new UploadThingError('Unauthorized', 401)

  const subscriptionPlan = await getUserSubscriptionPlan(user.id)

  return { subscriptionPlan, userId: user.id }
}

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>,
  file: {
    key: string,
    name: string,
    url: string
  }
}) => {
  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  })

  if (isFileExist) return

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://utfs.io/f/${file.key}`,
      uploadStatus: 'PROCESSING',
    },
  })

  try {
    const response = await fetch(`https://utfs.io/f/${file.key}`)
    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.statusText}`);
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
  
    const blob = await response.blob()
    const loader = new PDFLoader(blob)
    const pageLevelDocs = await loader.load()
    const pagesAmt = pageLevelDocs.length

    console.log(`Subscription Plan: ${metadata.subscriptionPlan.name}`);
    console.log(`Number of pages in PDF: ${pagesAmt}`);

    const isSubscribed = metadata.subscriptionPlan.name === 'Pro';
    const pageLimit = PLANS.find(plan => plan.name === (isSubscribed ? 'Pro' : 'Free')).pagesPerPdf;
    console.log(`Page limit for the plan: ${pageLimit}`);
    const isLimitExceeded = pagesAmt > pageLimit;
    console.log(`Is page limit exceeded? ${isLimitExceeded}`);

    if (isLimitExceeded) {
      await db.file.update({
        data: { uploadStatus: 'FAILED' },
        where: { id: createdFile.id },
      });
      console.log('Upload status set to FAILED due to page limit exceeded');
      return;
    }

    // const pinecone = await Pinecone()
    // const pineconeIndex = pinecone.Index('language-application')

    // Before calling PineconeStore.fromDocuments
    console.log(`Preparing to process ${pageLevelDocs.length} pages for embeddings and upsert.`);

    try {
      // Assuming you have a way to intercept or extend PineconeStore's behavior
      const pineconeIndex: VectorOperationsApi = pinecone.Index('language-application');
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      // Directly before the problematic call
      console.log("Page level documents being processed:", JSON.stringify(pageLevelDocs, null, 2));

      await PineconeStore.fromDocuments(
        pageLevelDocs,
        embeddings,
        {
          pineconeIndex,
          namespace: createdFile.id,
        }
      );

      // Success logging
      console.log('Upload status set to SUCCESS');
    } catch (err) {
      // Log the detailed error
      console.error('Error during file processing:', err);
    }

    await db.file.update({
      data: { uploadStatus: 'SUCCESS' },
      where: { id: createdFile.id },
    });
    console.log('Upload status set to SUCCESS');
  } catch (err) {
    console.error('Error during file processing:', err);
    await db.file.update({
      data: { uploadStatus: 'FAILED' },
      where: { id: createdFile.id },
    });
    console.log('Upload status set to FAILED due to processing error');
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '5MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '20MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
