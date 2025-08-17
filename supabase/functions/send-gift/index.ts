import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendGiftRequest {
  cubeId: string;
  cubeName: string;
  cubeCost: number;
  recipient: string;
  recipientType: 'email' | 'github';
  message?: string;
}



const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cubeId, cubeName, cubeCost, recipient, recipientType, message }: SendGiftRequest = await req.json();

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

    console.log(`🎁 Gift request from ${user.email}: ${cubeName} to ${recipient}`);

    // Check if sender has enough shards
    const { data: senderGameData, error: senderError } = await supabase
      .from('user_game_data')
      .select('total_shards')
      .eq('user_id', user.id)
      .single();

    if (senderError || !senderGameData) {
      return new Response(JSON.stringify({ error: 'Could not verify sender account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (senderGameData.total_shards < cubeCost) {
      return new Response(JSON.stringify({ error: 'Insufficient shards' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct shards from sender
    const { error: deductError } = await supabase
      .from('user_game_data')
      .update({ total_shards: senderGameData.total_shards - cubeCost })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Failed to deduct shards:', deductError);
      return new Response(JSON.stringify({ error: 'Failed to process payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create gift record in database
    const giftId = crypto.randomUUID();
    const { error: giftError } = await supabase
      .from('gifts')
      .insert({
        id: giftId,
        sender_id: user.id,
        sender_email: user.email,
        cube_id: cubeId,
        cube_name: cubeName,
        cube_cost: cubeCost,
        recipient: recipient,
        recipient_type: recipientType,
        message: message || '',
        claimed: false
      });

    if (giftError) {
      console.error('Failed to create gift record:', giftError);
      // Refund shards on failure
      await supabase
        .from('user_game_data')
        .update({ total_shards: senderGameData.total_shards })
        .eq('user_id', user.id);
        
      return new Response(JSON.stringify({ error: 'Failed to create gift' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Gift sent successfully: ${giftId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        giftId,
        message: `Gift sent successfully! ${recipient} will see it when they log in.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-gift function:", error);
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