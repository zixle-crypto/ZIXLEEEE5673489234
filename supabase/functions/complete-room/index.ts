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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user from the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { roomNumber, currentScore, shardsCollected }: CompleteRoomRequest = await req.json();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info from the JWT
    const jwt = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Room completion for user ${user.email}: Room ${roomNumber}, Score: ${currentScore}, Shards: ${shardsCollected}`);

    // Calculate shard reward based on room difficulty
    const baseShardReward = 10; // Base shards per room
    const difficultyMultiplier = Math.floor(roomNumber / 5) + 1; // Increases every 5 rooms
    const shardsEarned = baseShardReward * difficultyMultiplier + shardsCollected;

    console.log(`Calculated shard reward: ${shardsEarned} (base: ${baseShardReward}, multiplier: ${difficultyMultiplier}, collected: ${shardsCollected})`);

    // Update leaderboard using the database function
    const { data: leaderboardResult, error: leaderboardError } = await supabase
      .rpc('update_leaderboard', {
        p_user_id: user.id,
        p_email: user.email || 'Unknown',
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