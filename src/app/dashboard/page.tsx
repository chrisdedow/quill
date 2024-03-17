import Dashboard from '@/components/Dashboard'
import { db } from '@/db'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

// this is a server-side rendered page
const Page = async () => {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  // if user is not logged in, redirect to the auth-callback page
  if (!user || !user.id) redirect('/auth-callback?origin=dashboard')

  // get the user from the database
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id
    }
  })

  // if user is not found in the database, redirect to the auth-callback page
  if(!dbUser) redirect('/auth-callback?origin=dashboard')

  // get the user's subscription plan
  const subscriptionPlan = await getUserSubscriptionPlan()
  
  return <Dashboard subscriptionPlan={subscriptionPlan} />
}

export default Page;