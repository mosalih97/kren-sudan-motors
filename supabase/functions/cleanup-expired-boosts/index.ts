
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Call the cleanup function
    const { data: cleanupCount, error } = await supabaseClient.rpc('cleanup_expired_boosts');

    if (error) {
      console.error('Cleanup error:', error);
      return new Response(
        JSON.stringify({ error: "فشل في تنظيف التعزيزات المنتهية" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    console.log(`Cleaned up ${cleanupCount} expired boosts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم تنظيف ${cleanupCount} تعزيز منتهي الصلاحية`,
        cleaned_count: cleanupCount 
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: "خطأ داخلي في الخادم" }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
