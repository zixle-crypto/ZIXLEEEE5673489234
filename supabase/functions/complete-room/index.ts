import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CompleteRoomRequest {
  roomNumber: number;
  currentScore: number;
  shardsCollected: number;
  completionTime?: number; // Time in seconds to complete the room
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomNumber, currentScore, shardsCollected, completionTime }: CompleteRoomRequest = await req.json();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For demo purposes, use guest user data
    let userEmail = 'guest@demo.com';
    let userId = 'demo-user-id';
    
    // Try to get authenticated user, but don't require it
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const anonSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
        const jwt = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await anonSupabase.auth.getUser(jwt);
        
        if (user && !userError) {
          userEmail = user.email || userEmail;
          userId = user.id;
          console.log(`Authenticated user: ${userEmail}`);
        } else {
          console.log('Auth failed, using guest user:', userError?.message);
        }
      } catch (authError) {
        console.log('Auth error, using guest user:', authError);
      }
    } else {
      console.log('No auth header, using guest user');
    }

    console.log(`Room completion for user ${userEmail}: Room ${roomNumber}, Score: ${currentScore}, Shards: ${shardsCollected}, Time: ${completionTime}s`);

    // Basic anti-abuse: limit rewards based on reasonable completion times
    const minCompletionTime = Math.max(5, roomNumber * 1); // More reasonable minimum time
    const maxRewardableTime = roomNumber * 30; // Maximum time for full rewards
    
    if (completionTime && completionTime < minCompletionTime) {
      console.error(`Suspicious completion time for user ${userId}: ${completionTime}s for room ${roomNumber}`);
      return new Response(JSON.stringify({ error: 'Invalid completion time' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate shard rewards based on room number and completion time
    let baseShards = Math.min(roomNumber * 10, 1000); // Cap base shards to prevent inflation
    let timeBonus = 0;
    
    if (completionTime && completionTime < maxRewardableTime) {
      const efficiency = Math.max(0, (maxRewardableTime - completionTime) / maxRewardableTime);
      timeBonus = Math.floor(efficiency * baseShards * 0.5); // Max 50% bonus
    }
    
    const totalShards = Math.min(Math.max(shardsCollected, baseShards + timeBonus), 2000); // Overall cap

    console.log(`Calculated shard reward: ${totalShards} (base: ${baseShards}, time bonus: ${timeBonus}, collected: ${shardsCollected})`);

    // Update leaderboard using the database function with service role key
    const { data: leaderboardResult, error: leaderboardError } = await supabase
      .rpc('update_leaderboard', {
        p_user_id: userId,
        p_email: userEmail,
        p_shards_earned: totalShards,
        p_current_score: currentScore
      });

    if (leaderboardError) {
      console.error('Error updating leaderboard:', leaderboardError);
      throw new Error('Failed to update leaderboard');
    }

    console.log('Leaderboard updated successfully:', leaderboardResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        shardsEarned: totalShards,
        leaderboardData: leaderboardResult,
        message: `Room ${roomNumber} completed! Earned ${totalShards} shards!`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in complete-room function:", error);
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