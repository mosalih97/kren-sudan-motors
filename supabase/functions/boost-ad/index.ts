
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "غير مصرح بالوصول" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "غير مصرح بالوصول" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    if (req.method === 'POST') {
      const { ad_id, boost_type_id } = await req.json();

      if (!ad_id || !boost_type_id) {
        return new Response(
          JSON.stringify({ error: "معرف الإعلان ونوع التعزيز مطلوبان" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          }
        );
      }

      // Call the boost_ad function
      const { data: result, error } = await supabaseClient.rpc('boost_ad', {
        ad_id_param: ad_id,
        user_id_param: user.id,
        boost_type_id_param: boost_type_id
      });

      if (error) {
        console.error('Boost ad error:', error);
        return new Response(
          JSON.stringify({ error: "فشل في تعزيز الإعلان" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify(result), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: result.success ? 200 : 400 
        }
      );
    }

    if (req.method === 'GET') {
      // Get boost types
      const { data: boostTypes, error } = await supabaseClient
        .from('boost_types')
        .select('*')
        .order('points_cost', { ascending: true });

      if (error) {
        console.error('Get boost types error:', error);
        return new Response(
          JSON.stringify({ error: "فشل في جلب أنواع التعزيز" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ boost_types: boostTypes }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "طريقة غير مدعومة" }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 405 
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
