import {z} from "zod"

export const SendMessageValidator = z.object({
    fileId: z.string().optional(), // fileId is optional to allow for messages that are not tied to a file for messageChatAssistant
    message: z.string()
})