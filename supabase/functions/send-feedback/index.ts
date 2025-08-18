import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  feedback: string;
  userEmail: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { feedback, userEmail, timestamp }: FeedbackRequest = await req.json();

    if (!feedback || !feedback.trim()) {
      return new Response(
        JSON.stringify({ error: "Feedback is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: Deno.env.get("EMAIL_FROM") || "Perception Shift <feedback@resend.dev>",
      to: [Deno.env.get("EMAIL_FROM") || "feedback@resend.dev"],
      subject: "🎮 New Feedback - Perception Shift Game",
      html: `
        <div style="font-family: 'Courier New', monospace; background-color: #0a0a0a; color: #e0e0e0; padding: 20px; border-radius: 8px;">
          <h1 style="color: #00ff88; margin-bottom: 20px;">🎮 New Game Feedback</h1>
          
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="color: #00ff88; margin-top: 0;">Player Email:</h3>
            <p style="margin: 0; color: #cccccc;">${userEmail === 'Anonymous' ? 'Anonymous Player' : userEmail}</p>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="color: #00ff88; margin-top: 0;">Feedback:</h3>
            <p style="margin: 0; color: #cccccc; white-space: pre-wrap;">${feedback}</p>
          </div>
          
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px;">
            <h3 style="color: #00ff88; margin-top: 0;">Submitted:</h3>
            <p style="margin: 0; color: #cccccc;">${new Date(timestamp).toLocaleString()}</p>
          </div>
          
          <hr style="border: 1px solid #333; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            This feedback was sent from Perception Shift game.<br>
            Visit: <a href="https://perceptionshift.zixlestudios.com" style="color: #00ff88;">perceptionshift.zixlestudios.com</a>
          </p>
        </div>
      `,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send feedback",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);