// functions/send-code/index.ts
import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./mailer.ts"; // your SMTP helper

// Read from Deno env
const SUPABASE_URL      = 'https://gbelcrrcplsosonxskkt.functions.supabase.co' //Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' //Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Init Supabase with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

serve(async (req) => {
  try {
    const { email, code } = await req.json();

    // (Optional) Verify that the code exists and hasn’t expired
    const { data: entry, error: fetchErr } = await supabase
      .from("login_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchErr || !entry) {
      return new Response("Invalid or expired code", { status: 400 });
    }

    // Send the email
    await sendMail({
      to:      email,
      subject: "Your FitFlow login code",
      text:    `Your FitFlow login code is ${code}. It expires in 10 minutes.`,
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
});