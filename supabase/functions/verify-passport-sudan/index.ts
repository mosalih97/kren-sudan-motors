
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== بدء تشغيل دالة verify-passport-sudan ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imagePath, receiptId } = await req.json()
    
    if (!imagePath) {
      return new Response(
        JSON.stringify({ success: false, message: 'مسار الصورة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('مسار الصورة:', imagePath)
    console.log('معرف الإيصال:', receiptId)

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // الحصول على معرف المستخدم من JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'مطلوب تسجيل الدخول' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('خطأ في المستخدم:', userError)
      return new Response(
        JSON.stringify({ success: false, message: 'مستخدم غير صالح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء رابط موقع مؤقت للصورة
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('user-passports')
      .createSignedUrl(imagePath, 600)

    if (signedUrlError || !signedUrlData) {
      console.error('خطأ في إنشاء الرابط الموقع:', signedUrlError)
      return new Response(
        JSON.stringify({ success: false, message: 'فشل في الوصول لصورة الجواز' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحميل الصورة
    const imageResponse = await fetch(signedUrlData.signedUrl)
    if (!imageResponse.ok) {
      console.error('فشل في تحميل الصورة:', imageResponse.status)
      return new Response(
        JSON.stringify({ success: false, message: 'فشل في تحميل صورة الجواز' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحويل الصورة إلى base64
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    // استخدام Google Vision API
    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    if (!visionApiKey) {
      console.error('Google Vision API key غير متوفر')
      return new Response(
        JSON.stringify({ success: false, message: 'خدمة تحليل الصور غير متوفرة حالياً' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    )

    if (!visionResponse.ok) {
      console.error('فشل في Google Vision API:', visionResponse.status)
      return new Response(
        JSON.stringify({ success: false, message: 'فشل في تحليل صورة الجواز' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    const extractedText = visionData.responses?.[0]?.textAnnotations?.[0]?.description || ''

    console.log('النص المستخرج:', extractedText)

    // التحقق من أن الجواز سوداني
    const isSudanesePassport = extractedText.includes('جمهورية السودان') || 
                               extractedText.includes('Republic of Sudan') ||
                               extractedText.includes('SUDAN') ||
                               extractedText.includes('Sudan')

    if (!isSudanesePassport) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'الجواز المرفوع ليس جوازاً سودانياً. يرجى رفع صورة واضحة للجواز السوداني' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // محاولة استخراج رقم الجواز
    const passportNumberMatch = extractedText.match(/(?:Passport\s*No\.?\s*:?\s*|رقم\s*الجواز\s*:?\s*)([A-Z]\d{7})/i)
    const passportNumber = passportNumberMatch ? passportNumberMatch[1] : null

    // محاولة استخراج الاسم
    const nameMatch = extractedText.match(/(?:Name\s*:?\s*|الاسم\s*:?\s*)([A-Za-z\s\u0621-\u064A]+)/i)
    const fullName = nameMatch ? nameMatch[1].trim() : null

    // حفظ البيانات في قاعدة البيانات
    const { error: insertError } = await supabase
      .from('verified_passports')
      .insert({
        user_id: user.id,
        passport_image_url: imagePath,
        passport_number: passportNumber,
        full_name: fullName,
        receipt_id: receiptId,
        verified: true,
        verification_status: 'verified',
        extracted_text: extractedText
      })

    if (insertError) {
      console.error('خطأ في حفظ بيانات الجواز:', insertError)
      return new Response(
        JSON.stringify({ success: false, message: 'فشل في حفظ بيانات الجواز' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('تم حفظ بيانات الجواز بنجاح')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم التحقق من الجواز السوداني بنجاح',
        data: {
          passportNumber,
          fullName,
          isSudanesePassport
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('خطأ عام في دالة verify-passport-sudan:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'حدث خطأ أثناء التحقق من الجواز' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
