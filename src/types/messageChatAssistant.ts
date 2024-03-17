import { AppRouter } from '@/trpc'
import { inferRouterOutputs } from '@trpc/server'

// type of our our app's router
type RouterOutput = inferRouterOutputs<AppRouter>

type Messages = RouterOutput['getUserMessages']['messages']

type OmitText = Omit<Messages[number], 'text'>

type ExtendedText = {
  text: string | JSX.Element
}

export type ExtendedMessage = OmitText & ExtendedText
