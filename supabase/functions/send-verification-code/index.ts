import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request received:", body);
    
    // For now, just simulate success
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated code:", code, "for email:", body.email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent successfully",
        code: code, // Include code for testing
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});