// functions/create-stripe-session/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import Stripe from 'https://esm.sh/stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2022-11-15' })

serve(async (req) => {
  const { user } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID'), quantity: 1 }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { user_id: user.id }
    },
    customer_email: profile.email,
    success_url: 'https://fitflow.app/premium-success',
    cancel_url: 'https://fitflow.app/profile'
  })

  return new Response(JSON.stringify({ url: session.url }), { status: 200 })
})
