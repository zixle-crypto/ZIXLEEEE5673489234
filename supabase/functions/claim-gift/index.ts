import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ClaimGiftRequest {
  giftId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftId }: ClaimGiftRequest = await req.json();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const jwt = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(jwt);
    
    if (!user || userError) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎁 Claim request from ${user.email} for gift ${giftId}`);

    // Get the gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      return new Response(JSON.stringify({ error: 'Gift not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if gift is already claimed
    if (gift.claimed) {
      return new Response(JSON.stringify({ error: 'Gift has already been claimed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is the intended recipient
    const isEmailMatch = gift.recipient_type === 'email' && user.email === gift.recipient;
    // For GitHub, we could implement username verification later
    const isGitHubMatch = gift.recipient_type === 'github'; // Allow for now
    
    if (!isEmailMatch && !isGitHubMatch) {
      return new Response(JSON.stringify({ error: 'You are not the intended recipient of this gift' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create user game data
    let { data: gameData, error: gameError } = await supabase
      .from('user_game_data')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gameError) {
      console.error('Error fetching game data:', gameError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create game data if it doesn't exist
    if (!gameData) {
      const { data: newGameData, error: createError } = await supabase
        .from('user_game_data')
        .insert({
          user_id: user.id,
          total_shards: 0,
          active_shard_multiplier: 1.0,
          active_speed_boost: 1.0,
          active_protection: 0,
          shard_multiplier_rooms_left: 0,
          speed_boost_rooms_left: 0,
          protection_rooms_left: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating game data:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      gameData = newGameData;
    }

    // Add cube to user inventory
    const { error: inventoryError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        cube_id: gift.cube_id,
        quantity: 1
      });

    if (inventoryError) {
      // If cube already exists, update quantity
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ 
          quantity: supabase.rpc('increment_quantity', { increment_by: 1 })
        })
        .eq('user_id', user.id)
        .eq('cube_id', gift.cube_id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to add cube to inventory' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Mark gift as claimed
    const { error: claimError } = await supabase
      .from('gifts')
      .update({
        claimed: true,
        claimed_by: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', giftId);

    if (claimError) {
      console.error('Error marking gift as claimed:', claimError);
      return new Response(JSON.stringify({ error: 'Failed to claim gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Gift claimed successfully: ${gift.cube_name} by ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        cubeName: gift.cube_name,
        senderEmail: gift.sender_email,
        message: gift.message,
        claimedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in claim-gift function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);