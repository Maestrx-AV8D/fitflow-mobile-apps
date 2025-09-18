// supabase/functions/stripe-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import "jsr:@supabase/functions-js/edge-runtime";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const signingSecret = Deno.env.gest("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function planFromPriceLookup(lookup: string | null | undefined) {
  if (!lookup) return "free";
  if (lookup.startsWith("proai_")) return "pro_ai";
  if (lookup.startsWith("pro_")) return "pro";
  return "free";
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, sig!, signingSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const lookup = (sub.items.data[0]?.price?.lookup_key ?? null) as string | null;
        const plan = planFromPriceLookup(lookup);
        const endsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

        // Find user by email
        const email = session.customer_details?.email ?? (typeof session.customer === "string" ? undefined : session.customer?.email);
        if (email) {
          const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
          if (profile?.id) {
            await supabase.from("profiles").update({
              plan,
              plan_ends_at: endsAt,
              stripe_customer_id: typeof session.customer === "string" ? session.customer : (session.customer as any)?.id ?? null,
              stripe_subscription_id: sub.id,
              updated_at: new Date().toISOString(),
            }).eq("id", profile.id);
          }
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const lookup = sub.items.data[0]?.price?.lookup_key ?? null;
      const plan = sub.status === "active" ? planFromPriceLookup(lookup) : "free";
      const endsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

      // we stored stripe_customer_id in profiles
      const { data: profiles } = await supabase.from("profiles")
        .select("id").eq("stripe_customer_id", sub.customer as string);
      if (profiles && profiles.length > 0) {
        await supabase.from("profiles").update({
          plan,
          plan_ends_at: endsAt,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        }).in("id", profiles.map(p => p.id));
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
