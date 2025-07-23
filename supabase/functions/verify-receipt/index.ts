
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl, membershipId, receiptType } = await req.json()
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'رابط الصورة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('معالجة الإيصال:', { imageUrl, membershipId, receiptType })

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // تحويل الصورة إلى base64
    console.log('تحميل الصورة من:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error('فشل في تحميل الصورة:', imageResponse.status, imageResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'فشل في تحميل الصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
    console.log('تم تحويل الصورة إلى base64 بنجاح')

    // استخدام Google Vision API مع مفتاح API
    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    if (!apiKey) {
      console.error('مفتاح Google Vision API غير متوفر')
      return new Response(
        JSON.stringify({ error: 'مفتاح Google Vision API غير متوفر' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('استدعاء Google Vision API...')
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
      const errorText = await visionResponse.text()
      console.error('خطأ في Vision API:', visionResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'فشل في تحليل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    console.log('استجابة Google Vision API:', JSON.stringify(visionData, null, 2))
    
    if (!visionData.responses?.[0]?.textAnnotations?.[0]) {
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
    
    // البحث عن رقم الحساب بجميع الصيغ الممكنة
    const fullAccountPattern = new RegExp(fullAccountNumber.replace(/\s/g, '\\s*'))
    const shortAccountPattern = new RegExp(shortAccountNumber)
    const accountWithSpacesPattern = /0913\s*0368\s*9929\s*0001/
    const accountWithoutSpacesPattern = /09130368992900001/
    
    const hasFullAccount = fullAccountPattern.test(extractedText)
    const hasShortAccount = shortAccountPattern.test(extractedText)
    const hasAccountWithSpaces = accountWithSpacesPattern.test(extractedText)
    const hasAccountWithoutSpaces = accountWithoutSpacesPattern.test(extractedText)
    
    const hasAccountNumber = hasFullAccount || hasShortAccount || hasAccountWithSpaces || hasAccountWithoutSpaces
    
    const beneficiaryPattern = /محمد الامين منتصر صالح عبدالقادر|محمد الامين|منتصر صالح|عبدالقادر/
    const hasBeneficiary = beneficiaryPattern.test(extractedText)
    
    const amountPattern = /25000|25,000|٢٥٠٠٠|٢٥،٠٠٠|25\.000/
    const hasAmount = amountPattern.test(extractedText)
    
    // البحث عن رقم العضوية
    const membershipIdPattern = new RegExp(membershipId)
    const hasMembershipId = membershipIdPattern.test(extractedText)

    console.log('نتائج الفحص:', {
      hasFullAccount,
      hasShortAccount,
      hasAccountWithSpaces,
      hasAccountWithoutSpaces,
      hasAccountNumber,
      hasBeneficiary,
      hasAmount,
      hasMembershipId,
      membershipId
    })

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
          status: 'rejected'
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

      console.log('تم تفعيل الاشتراك المميز بنجاح')

      return new Response(
        JSON.stringify({
          message: 'تم التحقق من الإيصال وتفعيل الاشتراك بنجاح',
          status: 'approved',
          membershipId,
          receiptType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إذا لم يتم العثور على رقم العضوية
    console.log('لم يتم العثور على رقم العضوية في الإيصال')
    return new Response(
      JSON.stringify({
        message: 'تم التحقق من بيانات الإيصال بنجاح، لكن لم يتم العثور على رقم العضوية',
        status: 'partial_success',
        receiptType
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
