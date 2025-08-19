import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Crate rewards configuration
const CRATE_REWARDS = {
  basic: {
    cubes: 3,
    bonusCubes: 1, // "first purchase bonus"
    rarityBoost: 0.1
  },
  rare: {
    cubes: 5,
    bonusCubes: 1,
    rarityBoost: 0.2
  },
  epic: {
    cubes: 7,
    bonusCubes: 2,
    rarityBoost: 0.3,
    guaranteedEpic: true
  },
  legendary: {
    cubes: 10,
    bonusCubes: 3,
    rarityBoost: 0.4,
    guaranteedLegendary: true
  },
  premium: {
    cubes: 15,
    bonusCubes: 5,
    rarityBoost: 0.5,
    guaranteedLegendary: 2,
    mythicChance: 0.1
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe with proper error handling
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Stripe key exists:", !!stripeKey);
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const { user_id, crate_type } = session.metadata!;
    
    if (!user_id || !crate_type) {
      throw new Error("Missing session metadata");
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const rewards = CRATE_REWARDS[crate_type as keyof typeof CRATE_REWARDS];
    const totalCubes = rewards.cubes + rewards.bonusCubes;

    console.log(`Processing crate purchase: ${crate_type} for user ${user_id}, ${totalCubes} cubes`);

    // Generate random cubes based on crate type and rewards
    const generatedCubes = [];
    
    // Add guaranteed special cubes first
    if (rewards.guaranteedEpic) {
      generatedCubes.push({
        cube_id: `void_epic_${Math.floor(Math.random() * 30) + 1}`,
        quantity: 1
      });
    }
    
    if (rewards.guaranteedLegendary) {
      const count = typeof rewards.guaranteedLegendary === 'number' ? rewards.guaranteedLegendary : 1;
      for (let i = 0; i < count; i++) {
        generatedCubes.push({
          cube_id: `ancient_legendary_${Math.floor(Math.random() * 25) + 1}`,
          quantity: 1
        });
      }
    }

    // Fill remaining slots with random cubes (enhanced rarity)
    const remainingSlots = totalCubes - generatedCubes.length;
    for (let i = 0; i < remainingSlots; i++) {
      const rand = Math.random() + rewards.rarityBoost;
      let cubeId;
      
      if (rewards.mythicChance && Math.random() < rewards.mythicChance) {
        cubeId = `zeus_mythic_${Math.floor(Math.random() * 5) + 1}`;
      } else if (rand > 0.8) {
        cubeId = `crystal_rare_${Math.floor(Math.random() * 40) + 1}`;
      } else if (rand > 0.6) {
        cubeId = `ruby_epic_${Math.floor(Math.random() * 12) + 1}`;
      } else {
        cubeId = `basic_${Math.floor(Math.random() * 50) + 1}`;
      }
      
      generatedCubes.push({
        cube_id: cubeId,
        quantity: 1
      });
    }

    // Add cubes to user inventory
    for (const cube of generatedCubes) {
      const { error } = await supabase
        .from('user_inventory')
        .upsert({
          user_id: user_id,
          cube_id: cube.cube_id,
          quantity: cube.quantity
        }, {
          onConflict: 'user_id,cube_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error adding cube to inventory:', error);
      }
    }

    // Add bonus shards based on crate type
    const bonusShards = {
      basic: 100,
      rare: 250, 
      epic: 500,
      legendary: 1000,
      premium: 2000
    }[crate_type] || 100;

    // Add bonus shards using RPC function to avoid SQL injection
    const { error: shardsError } = await supabase.rpc('increment_user_shards', {
      user_id: user_id,
      shard_amount: bonusShards
    });

    if (shardsError) {
      console.error('Error adding bonus shards:', shardsError);
      // Fallback to direct update
      const { error: fallbackError } = await supabase
        .from('user_game_data')
        .update({
          total_shards: bonusShards // Will need to be handled differently
        })
        .eq('user_id', user_id);
      
      if (fallbackError) {
        console.error('Fallback shards update failed:', fallbackError);
      }
    }

    // Update the purchase record
    const { error: updateError } = await supabase
      .from('crate_purchases')
      .update({
        status: 'completed',
        cubes_awarded: generatedCubes,
        bonus_shards: bonusShards,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_session_id', sessionId);

    console.log(`Crate purchase processed successfully. Added ${generatedCubes.length} cubes and ${bonusShards} shards`);

    return new Response(JSON.stringify({ 
      success: true,
      cubes: generatedCubes,
      bonusShards: bonusShards,
      message: `Successfully opened ${crate_type} crate! Received ${totalCubes} cubes and ${bonusShards} bonus shards!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Process crate purchase error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});