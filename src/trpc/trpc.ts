import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError, initTRPC } from '@trpc/server'

const t = initTRPC.create()
const middleware = t.middleware

/**
 * Middleware function that checks if the user is authenticated.
 * If the user is not authenticated, it throws a TRPCError with code 'UNAUTHORIZED'.
 * If the user is authenticated, it calls the next middleware function with the user's information added to the context.
 *
 * @param opts - The options object containing the context and the next middleware function.
 * @returns The result of calling the next middleware function with the updated context.
 * @throws TRPCError with code 'UNAUTHORIZED' if the user is not authenticated.
 */
const isAuth = middleware(async (opts) => {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      userId: user.id,
      user,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)
