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

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const city = url.searchParams.get('city');
      const brand = url.searchParams.get('brand');
      const min_price = url.searchParams.get('min_price');
      const max_price = url.searchParams.get('max_price');

      // تنظيف الإعلانات المنتهية الصلاحية أولاً
      const { error: cleanupError } = await supabaseClient.rpc('cleanup_expired_top_spots');
      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      // إنشاء الاستعلام
      let query = supabaseClient
        .from('ads')
        .select(`
          *,
          profiles!inner(
            display_name,
            avatar_url,
            membership_type,
            user_id_display
          )
        `)
        .eq('status', 'active');

      // تطبيق الفلاتر
      if (city) {
        query = query.eq('city', city);
      }
      if (brand) {
        query = query.eq('brand', brand);
      }
      if (min_price) {
        query = query.gte('price', parseInt(min_price));
      }
      if (max_price) {
        query = query.lte('price', parseInt(max_price));
      }

      // تحديث نقاط الأولوية للإعلانات النشطة
      const { data: allActiveAds } = await supabaseClient
        .from('ads')
        .select('id')
        .eq('status', 'active');

      if (allActiveAds) {
        for (const ad of allActiveAds) {
          await supabaseClient.rpc('calculate_ad_priority_score', {
            ad_id_param: ad.id
          });
        }
      }

      // تطبيق الترتيب والتصفح
      const { data: ads, error } = await query
        .order('top_spot', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Query error:', error);
        return new Response(
          JSON.stringify({ error: "فشل في جلب الإعلانات" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }

      // تسجيل مشاهدة الإعلانات
      const authHeader = req.headers.get("Authorization");
      let viewerUserId = null;
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        viewerUserId = data.user?.id || null;
      }

      // تسجيل المشاهدات للإعلانات المعروضة
      for (const ad of ads || []) {
        await supabaseClient.rpc('record_ad_view', {
          ad_id_param: ad.id,
          viewer_user_id: viewerUserId
        });
      }

      // إضافة معلومات إضافية للإعلانات
      const enrichedAds = (ads || []).map(ad => ({
        ...ad,
        display_tier: ad.top_spot && new Date(ad.top_spot_until || '') > new Date() 
          ? 'top_spot'
          : ad.is_premium 
          ? 'premium' 
          : ad.is_featured 
          ? 'featured' 
          : 'regular',
        seller_name: ad.profiles?.display_name,
        seller_avatar: ad.profiles?.avatar_url,
        seller_membership: ad.profiles?.membership_type,
        seller_id_display: ad.profiles?.user_id_display
      }));

      return new Response(
        JSON.stringify({ 
          ads: enrichedAds,
          total: enrichedAds.length,
          offset: offset,
          limit: limit
        }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    }

    if (req.method === 'POST') {
      const { ad_id } = await req.json();

      if (!ad_id) {
        return new Response(
          JSON.stringify({ error: "معرف الإعلان مطلوب" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          }
        );
      }

      // تسجيل مشاهدة الإعلان
      const authHeader = req.headers.get("Authorization");
      let viewerUserId = null;
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        viewerUserId = data.user?.id || null;
      }

      const { error } = await supabaseClient.rpc('record_ad_view', {
        ad_id_param: ad_id,
        viewer_user_id: viewerUserId
      });

      if (error) {
        console.error('Record view error:', error);
        return new Response(
          JSON.stringify({ error: "فشل في تسجيل المشاهدة" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }), 
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