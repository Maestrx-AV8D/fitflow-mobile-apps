// // functions/create-stripe-session/index.ts
// import { serve } from 'https://deno.land/std/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js'
// import Stripe from 'https://esm.sh/stripe'

// const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2022-11-15' })

// serve(async (req) => {
//   const { user } = await req.json()
//   const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

//   const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     mode: 'subscription',
//     line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID'), quantity: 1 }],
//     subscription_data: {
//       trial_period_days: 3,
//       metadata: { user_id: user.id }
//     },
//     customer_email: profile.email,
//     success_url: 'https://fitflow.app/premium-success',
//     cancel_url: 'https://fitflow.app/profile'
//   })

//   return new Response(JSON.stringify({ url: session.url }), { status: 200 })
// })


// supabase/functions/create-stripe-session/index.ts
// deno run --allow-net --allow-env
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import "jsr:@supabase/functions-js/edge-runtime";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

type Body = { user: { id: string; email?: string }, plan: "premium" | "ai", term?: "monthly" | "yearly" };

const LOOKUP: Record<string, string> = {
  // premium = Pro (non-AI)
  "premium:monthly": "pro_month",
  "premium:yearly":  "pro_year",
  // ai = Pro+AI
  "ai:monthly": "proai_month",
  "ai:yearly":  "proai_year",
};

Deno.serve(async (req) => {
  try {
    const { user, plan, term = "yearly" } = await req.json() as Body;
    const priceLookupKey = LOOKUP[`${plan}:${term}`];
    if (!user?.id || !priceLookupKey) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });
    }

    // success/cancel deep link
    const returnUrl = Deno.env.get("APP_RETURN_URL") || "fitflow://premium-result";

    // ensure Stripe customer
    const customers = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
    const customer = customers.data[0] ?? await stripe.customers.create({ email: user.email });

    // checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: `lookup_${priceLookupKey}`, quantity: 1 }],
      success_url: `${returnUrl}?status=success`,
      cancel_url: `${returnUrl}?status=cancel`,
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
