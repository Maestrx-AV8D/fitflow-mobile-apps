// supabase/functions/restore-purchases/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import "jsr:@supabase/functions-js/edge-runtime";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization")!;
    const jwt = auth?.replace("Bearer ", "");
    const userRes = await supabase.auth.getUser(jwt);
    const user = userRes.data.user;
    if (!user) return new Response("unauthorized", { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    const customers = await stripe.customers.list({ email: profile?.email ?? user.email ?? undefined, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return new Response(JSON.stringify({ updated: false }), { headers: { "Content-Type": "application/json" } });

    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 1 });
    const sub = subs.data[0];

    let plan = "free";
    let endsAt: string | null = null;
    if (sub && (sub.status === "active" || sub.status === "trialing")) {
      const lookup = sub.items.data[0]?.price?.lookup_key ?? null;
      plan = (lookup && lookup.startsWith("proai_")) ? "pro_ai" : (lookup && lookup.startsWith("pro_")) ? "pro" : "free";
      endsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    }

    await supabase.from("profiles").update({
      plan,
      plan_ends_at: endsAt,
      stripe_customer_id: customer.id,
      stripe_subscription_id: sub?.id ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    return new Response(JSON.stringify({ updated: true, plan }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
