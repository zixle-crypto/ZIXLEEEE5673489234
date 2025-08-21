import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Crate pricing with attractive marketing
const CRATE_PRICING = {
  basic: {
    price: 299, // $2.99
    name: "Starter Crate",
    description: "Perfect for beginners! 3 cubes guaranteed",
    marketing: "🎯 BEST FOR BEGINNERS",
    bonusText: "Bonus: +10% first purchase"
  },
  rare: {
    price: 499, // $4.99
    name: "Adventure Crate", 
    description: "Higher rare cube chances! 5 cubes guaranteed",
    marketing: "⭐ MOST POPULAR",
    bonusText: "Bonus: 2x rare chance"
  },
  epic: {
    price: 999, // $9.99
    name: "Hero Crate",
    description: "Epic cubes await! 7 cubes + bonus epic guaranteed",
    marketing: "🔥 LIMITED TIME",
    bonusText: "FREE epic cube included!"
  },
  legendary: {
    price: 1999, // $19.99
    name: "Champion Bundle",
    description: "Legendary power! 10 cubes + guaranteed legendary",
    marketing: "💎 BEST VALUE",
    bonusText: "Save $5 vs buying separate"
  },
  premium: {
    price: 2999, // $29.99
    name: "Ultimate Collection",
    description: "Maximum rewards! 15 cubes + 2 legendaries guaranteed",
    marketing: "👑 PREMIUM CHOICE",
    bonusText: "Exclusive: Mythic cube chance"
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CRATE PAYMENT FUNCTION STARTED ===");
    console.log("Environment check - STRIPE_SECRET_KEY exists:", !!Deno.env.get("STRIPE_SECRET_KEY"));
    
    const { crateType } = await req.json();
    console.log("Requested crate type:", crateType);
    
    if (!crateType || !CRATE_PRICING[crateType as keyof typeof CRATE_PRICING]) {
      console.error("Invalid crate type provided:", crateType);
      throw new Error("Invalid crate type");
    }

    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("Supabase client created");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("Authorization required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    console.log("Extracting user from token...");
    
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      console.error("User not authenticated or no email");
      throw new Error("User not authenticated");
    }
    
    console.log("User authenticated:", user.email);

    // Initialize Stripe with environment variable
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY environment variable not found");
      throw new Error("Stripe configuration error");
    }
    console.log("Stripe key configured");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const crateInfo = CRATE_PRICING[crateType as keyof typeof CRATE_PRICING];

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: crateInfo.name,
              description: crateInfo.description,
              images: [], // You can add crate images here later
            },
            unit_amount: crateInfo.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/crate-success?session_id={CHECKOUT_SESSION_ID}&crate_type=${crateType}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        crate_type: crateType,
        user_email: user.email
      }
    });

    // Record the purchase attempt in our database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("crate_purchases").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      crate_type: crateType,
      amount: crateInfo.price,
      status: "pending"
    });

    console.log(`Crate payment session created for user ${user.email}, crate: ${crateType}`);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Crate payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});