
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleVisionResponse {
  responses: [{
    textAnnotations: [{
      description: string;
    }];
  }];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'رابط الصورة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('معالجة الصورة:', imageUrl)

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // الحصول على مفتاح Google Vision API
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: 'مفتاح Google Vision API غير متوفر' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceAccount = JSON.parse(serviceAccountJson)

    // تحويل الصورة إلى base64
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'فشل في تحميل الصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    // إنشاء JWT token للمصادقة مع Google
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // تحويل إلى base64
    const headerB64 = btoa(JSON.stringify(header))
    const payloadB64 = btoa(JSON.stringify(payload))

    // إنشاء التوقيع (simplified version - in production use proper JWT library)
    const signatureInput = `${headerB64}.${payloadB64}`
    
    // الحصول على access token من Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${headerB64}.${payloadB64}.${serviceAccount.private_key}` // Simplified
      })
    })

    // استخدام مفتاح API مباشرة بدلاً من JWT المعقد
    const apiKey = serviceAccount.private_key_id || 'YOUR_API_KEY'

    // استدعاء Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    )

    if (!visionResponse.ok) {
      console.error('خطأ في Vision API:', await visionResponse.text())
      return new Response(
        JSON.stringify({ error: 'فشل في تحليل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData: GoogleVisionResponse = await visionResponse.json()
    
    if (!visionData.responses?.[0]?.textAnnotations?.[0]) {
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على نص في الصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extractedText = visionData.responses[0].textAnnotations[0].description
    console.log('النص المستخرج:', extractedText)

    // البحث عن البيانات المطلوبة - استخدام رقم الحساب الكامل للفحص
    const fullAccountNumber = "0913 0368 9929 0001"
    const accountNumberPattern = new RegExp(fullAccountNumber.replace(/\s/g, '\\s*'))
    
    // البحث عن رقم الحساب المختصر أيضاً في حالة عدم ظهور الرقم الكامل
    const shortAccountNumberPattern = /3689929/
    
    const beneficiaryPattern = /محمد الامين منتصر صالح عبدالقادر/
    const amountPattern = /25000|25,000|٢٥٠٠٠|٢٥،٠٠٠/
    const membershipIdPattern = /\b\d{8}\b/

    const hasFullAccountNumber = accountNumberPattern.test(extractedText)
    const hasShortAccountNumber = shortAccountNumberPattern.test(extractedText)
    const hasAccountNumber = hasFullAccountNumber || hasShortAccountNumber
    const hasBeneficiary = beneficiaryPattern.test(extractedText)
    const hasAmount = amountPattern.test(extractedText)
    const membershipIdMatch = extractedText.match(membershipIdPattern)

    console.log('فحص البيانات:', {
      hasFullAccountNumber,
      hasShortAccountNumber,
      hasAccountNumber,
      hasBeneficiary,
      hasAmount,
      membershipIdMatch
    })

    // التحقق من وجود البيانات الأساسية
    if (!hasAccountNumber || !hasBeneficiary || !hasAmount) {
      const missingData = []
      if (!hasAccountNumber) missingData.push('رقم الحساب')
      if (!hasBeneficiary) missingData.push('اسم المستفيد')
      if (!hasAmount) missingData.push('المبلغ')

      return new Response(
        JSON.stringify({
          error: `البيانات المطلوبة غير مكتملة: ${missingData.join(', ')}`,
          status: 'rejected'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا وجد رقم العضوية، تحقق من الطلب
    if (membershipIdMatch) {
      const membershipId = membershipIdMatch[0]

      // البحث عن الطلب في قاعدة البيانات
      const { data: submission, error: fetchError } = await supabase
        .from('receipt_submissions')
        .select('*')
        .eq('membership_id', membershipId)
        .eq('status', 'pending')
        .single()

      if (fetchError || !submission) {
        console.error('خطأ في جلب الطلب:', fetchError)
        return new Response(
          JSON.stringify({ error: 'لم يتم العثور على طلب مطابق' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from('receipt_submissions')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
          extracted_text: extractedText
        })
        .eq('id', submission.id)

      if (updateError) {
        console.error('خطأ في تحديث الطلب:', updateError)
        return new Response(
          JSON.stringify({ error: 'خطأ في تحديث الطلب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // تفعيل الاشتراك المميز
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          membership_type: 'premium',
          credits: 130,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 يوم
        })
        .eq('user_id', submission.user_id)

      if (profileError) {
        console.error('خطأ في تفعيل الاشتراك:', profileError)
        return new Response(
          JSON.stringify({ error: 'خطأ في تفعيل الاشتراك' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          message: 'تم التحقق من الإيصال وتفعيل الاشتراك بنجاح',
          status: 'approved',
          membershipId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا لم يتم العثور على رقم العضوية
    return new Response(
      JSON.stringify({
        message: 'تم التحقق من بيانات الإيصال بنجاح، لكن لم يتم العثور على رقم العضوية',
        status: 'partial_success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('خطأ في التحقق من الإيصال:', error)
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء التحقق من الإيصال' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
