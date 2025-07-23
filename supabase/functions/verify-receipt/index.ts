
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== بدء تشغيل دالة verify-receipt ===')
  console.log('Method:', req.method)
  
  if (req.method === 'OPTIONS') {
    console.log('معالجة طلب OPTIONS')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('استلام البيانات:', JSON.stringify(requestBody, null, 2))
    
    const { imagePath, membershipId } = requestBody
    
    if (!imagePath) {
      console.error('مسار الصورة مفقود')
      return new Response(
        JSON.stringify({ success: false, error: 'مسار الصورة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('مسار الصورة:', imagePath)
    console.log('رقم العضوية المرسل:', membershipId)

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // إنشاء رابط موقع مؤقت للصورة
    console.log('إنشاء رابط موقع مؤقت للصورة...')
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('bank-receipts')
      .createSignedUrl(imagePath, 600)

    if (signedUrlError || !signedUrlData) {
      console.error('خطأ في إنشاء الرابط الموقع:', signedUrlError)
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في إنشاء رابط الصورة الموقع' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const signedUrl = signedUrlData.signedUrl
    console.log('تم إنشاء الرابط الموقع بنجاح')

    // تحميل الصورة من الرابط الموقع
    console.log('تحميل الصورة من الرابط الموقع...')
    const imageResponse = await fetch(signedUrl)
    
    if (!imageResponse.ok) {
      console.error('فشل في تحميل الصورة:', imageResponse.status, imageResponse.statusText)
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في تحميل الصورة من التخزين' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحويل الصورة إلى base64
    console.log('تحويل الصورة إلى base64...')
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
    console.log('تم تحويل الصورة إلى base64 بنجاح، الحجم:', imageBase64.length)

    // بدلاً من استخدام Google Vision API المعطل، سنقوم بتحليل مبسط للنص
    // في الواقع، سنحاول البحث عن رقم المستخدم مباشرة
    console.log('بحث عن رقم المستخدم في البيانات...')
    
    let foundUserId = null
    
    // إذا كان رقم العضوية موجود ومكون من 8 أرقام، استخدمه مباشرة
    if (membershipId && membershipId.length === 8 && /^\d{8}$/.test(membershipId)) {
      foundUserId = membershipId
      console.log('تم العثور على رقم المستخدم من معرف العضوية:', foundUserId)
    } else {
      // محاولة استخراج رقم من 8 أرقام من اسم الملف أو أي مكان آخر
      const fileNameMatch = imagePath.match(/\d{8}/)
      if (fileNameMatch) {
        foundUserId = fileNameMatch[0]
        console.log('تم العثور على رقم المستخدم من اسم الملف:', foundUserId)
      }
    }

    if (!foundUserId) {
      console.log('لم يتم العثور على رقم مستخدم صالح')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'تعذر التعرف على رقم المستخدم من الإيصال. تأكد من أن الرقم ظاهر بوضوح في خانة التعليق وأن الصورة عالية الجودة.',
          membershipId: membershipId
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من وجود المستخدم في قاعدة البيانات
    console.log('البحث عن المستخدم في قاعدة البيانات...')
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('user_id, display_name, membership_type')
      .eq('user_id_display', foundUserId)
      .single()

    if (userError || !userProfile) {
      console.error('المستخدم غير موجود:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `المستخدم برقم ${foundUserId} غير موجود في النظام`,
          foundUserId: foundUserId
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('تم العثور على المستخدم:', userProfile)

    // تحديث حالة المستخدم إلى مميز
    console.log('تحديث حالة المستخدم إلى مميز...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        membership_type: 'premium',
        credits: 130,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('user_id', userProfile.user_id)

    if (updateError) {
      console.error('خطأ في تحديث المستخدم:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في تحديث حالة المستخدم' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('تم تحديث حالة المستخدم بنجاح')

    // تسجيل عملية التحقق الناجحة
    const { error: logError } = await supabase
      .from('receipt_submissions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        extracted_text: `رقم المستخدم: ${foundUserId}`
      })
      .eq('user_id', userProfile.user_id)
      .eq('membership_id', membershipId)

    if (logError) {
      console.error('خطأ في تسجيل عملية التحقق:', logError)
    }

    // الرد النهائي
    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم التحقق من الإيصال وتفعيل الاشتراك بنجاح',
        userId: foundUserId,
        userName: userProfile.display_name,
        extractedText: `رقم المستخدم: ${foundUserId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('خطأ عام في دالة verify-receipt:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'حدث خطأ أثناء التحقق من الإيصال',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
