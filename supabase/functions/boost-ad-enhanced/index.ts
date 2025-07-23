
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

    // Get user from request
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "غير مخول" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    if (req.method === 'POST') {
      const { ad_id, boost_plan = 'basic' } = await req.json();

      if (!ad_id) {
        return new Response(
          JSON.stringify({ error: "معرف الإعلان مطلوب" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          }
        );
      }

      console.log('Boosting ad:', ad_id, 'with plan:', boost_plan, 'for user:', user.id);

      // تنظيف الإعلانات المنتهية الصلاحية أولاً
      const { error: cleanupError } = await supabaseClient.rpc('cleanup_expired_top_spots');
      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      // ترقية الإعلان باستخدام الدالة المحسنة
      const { data: result, error } = await supabaseClient.rpc('boost_ad_enhanced', {
        ad_id_param: ad_id,
        user_id_param: user.id,
        boost_plan: boost_plan
      });

      if (error) {
        console.error('Boost error:', error);
        return new Response(
          JSON.stringify({ error: error.message || "فشل في ترقية الإعلان" }), 
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
          status: 200 
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const ad_id = url.searchParams.get('ad_id');
      const boost_plan = url.searchParams.get('boost_plan') || 'basic';

      if (!ad_id) {
        return new Response(
          JSON.stringify({ error: "معرف الإعلان مطلوب" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          }
        );
      }

      // فحص إمكانية الترقية باستخدام الدالة المحسنة
      const { data: canBoost, error } = await supabaseClient.rpc('can_boost_ad_enhanced', {
        ad_id_param: ad_id,
        user_id_param: user.id,
        boost_plan: boost_plan
      });

      if (error) {
        console.error('Can boost check error:', error);
        return new Response(
          JSON.stringify({ error: "فشل في فحص إمكانية الترقية" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify(canBoost), 
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
