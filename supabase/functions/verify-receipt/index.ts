
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
    console.log('استلام event.body:', JSON.stringify(requestBody, null, 2))
    
    const { imagePath, membershipId, receiptType } = requestBody
    
    if (!imagePath) {
      console.error('مسار الصورة مفقود')
      return new Response(
        JSON.stringify({ error: 'مسار الصورة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!membershipId) {
      console.error('رقم العضوية مفقود')
      return new Response(
        JSON.stringify({ error: 'رقم العضوية مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('مسار الصورة:', imagePath)
    console.log('رقم العضوية:', membershipId)
    console.log('نوع الإيصال:', receiptType)

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // إنشاء رابط موقع مؤقت للصورة
    console.log('إنشاء رابط موقع مؤقت للصورة...')
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('bank-receipts')
      .createSignedUrl(imagePath, 300) // 5 دقائق

    if (signedUrlError || !signedUrlData) {
      console.error('خطأ في إنشاء الرابط الموقع:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'فشل في إنشاء رابط الصورة الموقع' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const signedUrl = signedUrlData.signedUrl
    console.log('تم إنشاء الرابط الموقع بنجاح:', signedUrl)

    // تحميل الصورة من الرابط الموقع
    console.log('تحميل الصورة من الرابط الموقع...')
    let imageResponse
    try {
      imageResponse = await fetch(signedUrl)
      console.log('حالة استجابة تحميل الصورة:', imageResponse.status)
    } catch (fetchError) {
      console.error('خطأ في تحميل الصورة:', fetchError)
      return new Response(
        JSON.stringify({ error: 'فشل في تحميل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!imageResponse.ok) {
      console.error('فشل في تحميل الصورة:', imageResponse.status, imageResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'فشل في تحميل الصورة من التخزين' }),
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
        JSON.stringify({ error: 'بيانات Google Service Account غير متوفرة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceAccount = JSON.parse(serviceAccountJSON)
    
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
    const keyData = serviceAccount.private_key
    
    // استيراد المفتاح الخاص
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      encoder.encode(keyData),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )

    // إنشاء التوقيع
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(signatureInput)
    )

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
      console.error('فشل في الحصول على Access Token:', tokenResponse.status)
      return new Response(
        JSON.stringify({ error: 'فشل في المصادقة مع Google' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

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
        JSON.stringify({ error: 'فشل في تحليل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    console.log('نتيجة Google Vision:', JSON.stringify(visionData, null, 2))
    
    if (!visionData.responses || !visionData.responses[0] || !visionData.responses[0].textAnnotations || !visionData.responses[0].textAnnotations[0]) {
      console.error('لم يتم العثور على نص في الصورة')
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على نص في الصورة' }),
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
    const fullAccountPattern = new RegExp(fullAccountNumber.replace(/\s/g, '\\s*'))
    const shortAccountPattern = new RegExp(shortAccountNumber)
    const accountWithSpacesPattern = /0913\s*0368\s*9929\s*0001/
    const accountWithoutSpacesPattern = /09130368992900001/
    
    const hasFullAccount = fullAccountPattern.test(extractedText)
    const hasShortAccount = shortAccountPattern.test(extractedText)
    const hasAccountWithSpaces = accountWithSpacesPattern.test(extractedText)
    const hasAccountWithoutSpaces = accountWithoutSpacesPattern.test(extractedText)
    
    const hasAccountNumber = hasFullAccount || hasShortAccount || hasAccountWithSpaces || hasAccountWithoutSpaces
    
    console.log('نتائج البحث عن رقم الحساب:')
    console.log('- الحساب الكامل:', hasFullAccount)
    console.log('- الحساب المختصر:', hasShortAccount)
    console.log('- الحساب مع المسافات:', hasAccountWithSpaces)
    console.log('- الحساب بدون مسافات:', hasAccountWithoutSpaces)
    console.log('- وجود رقم الحساب:', hasAccountNumber)
    
    // البحث عن اسم المستفيد
    console.log('البحث عن اسم المستفيد...')
    const beneficiaryPattern = /محمد الامين منتصر صالح عبدالقادر|محمد الامين|منتصر صالح|عبدالقادر/
    const hasBeneficiary = beneficiaryPattern.test(extractedText)
    console.log('وجود اسم المستفيد:', hasBeneficiary)
    
    // البحث عن المبلغ
    console.log('البحث عن المبلغ...')
    const amountPattern = /25000|25,000|٢٥٠٠٠|٢٥،٠٠٠|25\.000/
    const hasAmount = amountPattern.test(extractedText)
    console.log('وجود المبلغ:', hasAmount)
    
    // البحث عن رقم العضوية في خانة التعليق
    console.log('=== خطوات مطابقة user_id ===')
    console.log('رقم العضوية المطلوب:', membershipId)
    console.log('البحث في النص المستخرج...')
    
    const membershipIdPattern = new RegExp(membershipId)
    const hasMembershipId = membershipIdPattern.test(extractedText)
    console.log('وجود رقم العضوية:', hasMembershipId)

    // البحث عن user_id في النص بطرق مختلفة
    const userIdSearchResults = []
    const userIdRegexes = [
      new RegExp(membershipId, 'g'),
      new RegExp(membershipId.replace(/\s/g, '\\s*'), 'g'),
      new RegExp(membershipId.split('').join('\\s*'), 'g')
    ]
    
    userIdRegexes.forEach((regex, index) => {
      const matches = extractedText.match(regex)
      if (matches) {
        userIdSearchResults.push({
          pattern: index,
          matches: matches,
          found: true
        })
      }
    })
    
    console.log('نتائج البحث عن user_id:', userIdSearchResults)

    // التحقق من وجود البيانات الأساسية
    if (!hasAccountNumber || !hasBeneficiary || !hasAmount) {
      const missingData = []
      if (!hasAccountNumber) missingData.push('رقم الحساب')
      if (!hasBeneficiary) missingData.push('اسم المستفيد')
      if (!hasAmount) missingData.push('المبلغ')

      console.log('بيانات مفقودة:', missingData)
      return new Response(
        JSON.stringify({
          error: `البيانات المطلوبة غير مكتملة: ${missingData.join(', ')}`,
          status: 'rejected',
          extractedText: extractedText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا وجد رقم العضوية، تحقق من الطلب وحدّث حالته
    if (hasMembershipId) {
      console.log('تم العثور على رقم العضوية، البحث عن الطلب...')
      
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
          JSON.stringify({ error: 'خطأ في تحديث الطلب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('تم تحديث حالة الطلب بنجاح')

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
          JSON.stringify({ error: 'خطأ في تفعيل الاشتراك' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('تم تفعيل الاشتراك المميز بنجاح')

      // الرد النهائي
      const finalResponse = {
        message: 'تم التحقق من الإيصال وتفعيل الاشتراك بنجاح',
        status: 'approved',
        membershipId,
        receiptType,
        extractedText: extractedText
      }
      
      console.log('الرد النهائي:', JSON.stringify(finalResponse, null, 2))
      
      return new Response(
        JSON.stringify(finalResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا لم يتم العثور على رقم العضوية
    console.log('لم يتم العثور على رقم العضوية في الإيصال')
    const partialResponse = {
      message: 'تم التحقق من بيانات الإيصال بنجاح، لكن لم يتم العثور على رقم العضوية',
      status: 'partial_success',
      receiptType,
      extractedText: extractedText
    }
    
    console.log('الرد الجزئي:', JSON.stringify(partialResponse, null, 2))
    
    return new Response(
      JSON.stringify(partialResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('خطأ عام في دالة verify-receipt:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'حدث خطأ أثناء التحقق من الإيصال',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
