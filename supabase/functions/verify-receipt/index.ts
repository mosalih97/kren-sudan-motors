
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
    // استلام البيانات من الطلب
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

    if (!membershipId) {
      console.error('رقم العضوية مفقود')
      return new Response(
        JSON.stringify({ success: false, error: 'رقم العضوية مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('مسار الصورة:', imagePath)
    console.log('رقم العضوية:', membershipId)

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // إنشاء رابط موقع مؤقت للصورة
    console.log('إنشاء رابط موقع مؤقت للصورة...')
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('bank-receipts')
      .createSignedUrl(imagePath, 600) // 10 دقائق

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

    // إعداد Google Service Account
    console.log('إعداد Google Service Account...')
    const serviceAccountJSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJSON) {
      console.error('بيانات Google Service Account غير متوفرة')
      return new Response(
        JSON.stringify({ success: false, error: 'بيانات Google Service Account غير متوفرة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(serviceAccountJSON)
    } catch (parseError) {
      console.error('خطأ في تحليل بيانات Google Service Account:', parseError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في تحليل بيانات Google Service Account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // تصحيح private_key
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }

    // إنشاء JWT Token للمصادقة
    console.log('إنشاء JWT Token للمصادقة...')
    const now = Math.floor(Date.now() / 1000)
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // تشفير JWT
    const encoder = new TextEncoder()
    const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const signatureInput = `${headerB64}.${payloadB64}`
    
    // إصلاح عملية تحويل المفتاح الخاص
    console.log('معالجة المفتاح الخاص...')
    
    // تنظيف المفتاح الخاص
    let privateKeyPem = serviceAccount.private_key
    // إزالة الرؤوس والتذييلات
    privateKeyPem = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/g, '')
    privateKeyPem = privateKeyPem.replace(/-----END PRIVATE KEY-----/g, '')
    // إزالة جميع المسافات والأسطر الجديدة
    privateKeyPem = privateKeyPem.replace(/\s+/g, '')
    
    // تحويل base64 إلى ArrayBuffer
    let keyBuffer
    try {
      const binaryString = atob(privateKeyPem)
      keyBuffer = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        keyBuffer[i] = binaryString.charCodeAt(i)
      }
    } catch (decodeError) {
      console.error('خطأ في فك تشفير المفتاح الخاص:', decodeError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في فك تشفير المفتاح الخاص' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // استيراد المفتاح الخاص
    let privateKey
    try {
      privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBuffer.buffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      )
    } catch (importError) {
      console.error('خطأ في استيراد المفتاح الخاص:', importError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في استيراد المفتاح الخاص' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء التوقيع
    let signatureBuffer
    try {
      signatureBuffer = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        encoder.encode(signatureInput)
      )
    } catch (signError) {
      console.error('خطأ في إنشاء التوقيع:', signError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في إنشاء التوقيع' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const jwt = `${signatureInput}.${signature}`

    // الحصول على Access Token
    console.log('الحصول على Access Token...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('فشل في الحصول على Access Token:', tokenResponse.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في المصادقة مع Google' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    console.log('تم الحصول على Access Token بنجاح')

    // استدعاء Google Vision API
    console.log('استدعاء Google Vision API...')
    const visionResponse = await fetch(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

    console.log('حالة استجابة Vision API:', visionResponse.status)

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      console.error('خطأ في Vision API:', visionResponse.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في تحليل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    console.log('نتيجة Google Vision:', JSON.stringify(visionData, null, 2))
    
    if (!visionData.responses || !visionData.responses[0] || !visionData.responses[0].textAnnotations || !visionData.responses[0].textAnnotations[0]) {
      console.error('لم يتم العثور على نص في الصورة')
      return new Response(
        JSON.stringify({ success: false, error: 'لم يتم العثور على نص في الصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extractedText = visionData.responses[0].textAnnotations[0].description
    console.log('النص المستخرج:', extractedText)

    // البحث عن البيانات المطلوبة
    const fullAccountNumber = "0913 0368 9929 0001"
    const shortAccountNumber = "3689929"
    
    // البحث عن رقم الحساب
    console.log('البحث عن رقم الحساب...')
    const accountPatterns = [
      /0913\s*0368\s*9929\s*0001/,
      /09130368992900001/,
      /3689929/
    ]
    
    const hasAccountNumber = accountPatterns.some(pattern => pattern.test(extractedText))
    console.log('وجود رقم الحساب:', hasAccountNumber)
    
    // البحث عن اسم المستفيد
    console.log('البحث عن اسم المستفيد...')
    const beneficiaryPatterns = [
      /محمد\s*الامين\s*منتصر\s*صالح\s*عبدالقادر/,
      /محمد\s*الامين/,
      /منتصر\s*صالح/,
      /عبدالقادر/
    ]
    
    const hasBeneficiary = beneficiaryPatterns.some(pattern => pattern.test(extractedText))
    console.log('وجود اسم المستفيد:', hasBeneficiary)
    
    // البحث عن المبلغ
    console.log('البحث عن المبلغ...')
    const amountPatterns = [
      /25000/,
      /25,000/,
      /25\.000/,
      /٢٥٠٠٠/,
      /٢٥،٠٠٠/
    ]
    
    const hasAmount = amountPatterns.some(pattern => pattern.test(extractedText))
    console.log('وجود المبلغ:', hasAmount)
    
    // البحث عن رقم العضوية
    console.log('البحث عن رقم العضوية:', membershipId)
    const membershipPattern = new RegExp(membershipId)
    const hasMembershipId = membershipPattern.test(extractedText)
    console.log('وجود رقم العضوية:', hasMembershipId)

    // التحقق من وجود البيانات الأساسية
    if (!hasAccountNumber || !hasBeneficiary || !hasAmount) {
      const missingData = []
      if (!hasAccountNumber) missingData.push('رقم الحساب')
      if (!hasBeneficiary) missingData.push('اسم المستفيد')
      if (!hasAmount) missingData.push('المبلغ')

      console.log('بيانات مفقودة:', missingData)
      return new Response(
        JSON.stringify({
          success: false,
          error: `البيانات المطلوبة غير مكتملة: ${missingData.join(', ')}`,
          extractedText: extractedText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا وجد رقم العضوية، تفعيل الاشتراك
    if (hasMembershipId) {
      console.log('تم العثور على رقم العضوية، تفعيل الاشتراك...')
      
      // البحث عن الطلب في قاعدة البيانات
      const { data: submission, error: fetchError } = await supabase
        .from('receipt_submissions')
        .select('*')
        .eq('membership_id', membershipId)
        .eq('status', 'pending')
        .maybeSingle()

      if (fetchError) {
        console.error('خطأ في جلب الطلب:', fetchError)
        return new Response(
          JSON.stringify({ success: false, error: 'خطأ في جلب الطلب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!submission) {
        console.log('لم يتم العثور على طلب مطابق')
        return new Response(
          JSON.stringify({ success: false, error: 'لم يتم العثور على طلب مطابق' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('تم العثور على الطلب:', submission.id)

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
          JSON.stringify({ success: false, error: 'خطأ في تحديث الطلب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // تفعيل الاشتراك المميز
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          membership_type: 'premium',
          credits: 130,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', submission.user_id)

      if (profileError) {
        console.error('خطأ في تفعيل الاشتراك:', profileError)
        return new Response(
          JSON.stringify({ success: false, error: 'خطأ في تفعيل الاشتراك' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('تم تفعيل الاشتراك المميز بنجاح')

      // الرد النهائي
      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم التحقق من الإيصال وتفعيل الاشتراك بنجاح',
          membershipId,
          extractedText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا لم يتم العثور على رقم العضوية
    console.log('لم يتم العثور على رقم العضوية في الإيصال')
    return new Response(
      JSON.stringify({
        success: false,
        message: 'تم التحقق من بيانات الإيصال، لكن لم يتم العثور على رقم العضوية',
        extractedText
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
