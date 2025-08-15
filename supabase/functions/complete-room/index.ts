import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
      const anonSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const jwt = authHeader.split(' ')[1];
      const { data: { user }, error: userError } = await anonSupabase.auth.getUser(jwt);
      
      if (user && !userError) {
        userEmail = user.email || userEmail;
        userId = user.id;
      } else {
        console.log('Using guest user for demo');
      }
    }

    console.log(`Room completion for user ${userEmail}: Room ${roomNumber}, Score: ${currentScore}, Shards: ${shardsCollected}, Time: ${completionTime}s`);

    // Calculate shard reward based on room difficulty and completion time
    const baseShardReward = 10; // Base shards per room
    const difficultyMultiplier = Math.floor(roomNumber / 5) + 1; // Increases every 5 rooms
    
    // Time bonus: faster completion = more shards (30 second target, max 2x multiplier)
    let timeMultiplier = 1;
    if (completionTime && completionTime > 0) {
      const targetTime = 30; // 30 seconds target
      timeMultiplier = Math.min(2, Math.max(0.5, targetTime / completionTime));
    }
    
    const shardsEarned = Math.floor((baseShardReward * difficultyMultiplier + shardsCollected) * timeMultiplier);

    console.log(`Calculated shard reward: ${shardsEarned} (base: ${baseShardReward}, difficulty: ${difficultyMultiplier}x, time: ${timeMultiplier.toFixed(2)}x, collected: ${shardsCollected})`);

    // Update leaderboard using the database function with service role key
    const { data: leaderboardResult, error: leaderboardError } = await supabase
      .rpc('update_leaderboard', {
        p_user_id: userId,
        p_email: userEmail,
        p_shards_earned: shardsEarned,
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
        shardsEarned,
        leaderboardData: leaderboardResult,
        message: `Room ${roomNumber} completed! Earned ${shardsEarned} shards!`
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