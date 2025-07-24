
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

    // استخدام Google Vision API لاستخراج النص
    console.log('بدء استخدام Google Vision API...')
    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    
    if (!visionApiKey) {
      console.error('Google Vision API Key مفقود')
      return new Response(
        JSON.stringify({ success: false, error: 'Google Vision API Key غير متوفر' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!visionResponse.ok) {
      console.error('فشل في استدعاء Google Vision API:', visionResponse.status, visionResponse.statusText)
      const errorText = await visionResponse.text()
      console.error('تفاصيل الخطأ:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في تحليل الصورة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    console.log('استجابة Google Vision API:', JSON.stringify(visionData, null, 2))

    if (!visionData.responses?.[0]?.textAnnotations?.[0]?.description) {
      console.error('لم يتم العثور على نص في الصورة')
      return new Response(
        JSON.stringify({ success: false, error: 'لم يتم العثور على نص في الصورة. تأكد من وضوح الصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extractedText = visionData.responses[0].textAnnotations[0].description
    console.log('النص المستخرج من الصورة:', extractedText)

    // استخراج رقم العملية - نبحث عن أرقام مختلفة الأطوال
    const transactionPatterns = [
      /\b\d{11}\b/g,    // 11 رقم
      /\b\d{10}\b/g,    // 10 أرقام
      /\b\d{9}\b/g,     // 9 أرقام
      /\b\d{8}\b/g,     // 8 أرقام
      /\b\d{12}\b/g,    // 12 رقم
      /\b\d{13}\b/g,    // 13 رقم
    ]

    let transactionNumber = null
    
    for (const pattern of transactionPatterns) {
      const matches = extractedText.match(pattern)
      if (matches && matches.length > 0) {
        // نختار أول رقم نجده
        transactionNumber = matches[0]
        console.log(`رقم العملية المستخرج (${transactionNumber.length} رقم):`, transactionNumber)
        break
      }
    }

    if (!transactionNumber) {
      console.error('لم يتم العثور على رقم العملية في الإيصال')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'لم يتم العثور على رقم العملية في الإيصال. تأكد من وضوح الصورة',
          extractedText: extractedText.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // استخراج التاريخ بصيغ مختلفة
    const datePatterns = [
      /\b(\d{1,2})-([A-Za-z]{3})-(\d{4})\b/g,           // DD-MMM-YYYY
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,             // DD/MM/YYYY
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,               // YYYY-MM-DD
      /\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/g,         // DD MMM YYYY
    ]

    let receiptDate = null
    
    for (const pattern of datePatterns) {
      const matches = [...extractedText.matchAll(pattern)]
      if (matches.length > 0) {
        const match = matches[0]
        
        if (pattern.source.includes('([A-Za-z]{3})')) {
          // تنسيق DD-MMM-YYYY
          const day = match[1].padStart(2, '0')
          const month = match[2]
          const year = match[3]
          
          const monthMap: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          }
          
          const monthNumber = monthMap[month]
          if (monthNumber) {
            receiptDate = `${year}-${monthNumber}-${day}`
          }
        } else if (pattern.source.includes('(\\d{1,2})\\/(\\d{1,2})')) {
          // تنسيق DD/MM/YYYY
          const day = match[1].padStart(2, '0')
          const month = match[2].padStart(2, '0')
          const year = match[3]
          receiptDate = `${year}-${month}-${day}`
        } else if (pattern.source.includes('(\\d{4})-(\\d{1,2})')) {
          // تنسيق YYYY-MM-DD
          receiptDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
        }
        
        if (receiptDate) {
          console.log('تاريخ الإيصال المستخرج:', receiptDate)
          break
        }
      }
    }

    // إذا لم نجد تاريخ، نستخدم تاريخ اليوم
    if (!receiptDate) {
      receiptDate = new Date().toISOString().split('T')[0]
      console.log('لم يتم العثور على تاريخ الإيصال، استخدام تاريخ اليوم:', receiptDate)
    }

    // التحقق من أن التاريخ ليس في المستقبل وليس أقدم من 7 أيام
    const today = new Date()
    const receiptDateObj = new Date(receiptDate)
    const daysDifference = Math.floor((today.getTime() - receiptDateObj.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log('تاريخ اليوم:', today.toISOString().split('T')[0])
    console.log('تاريخ الإيصال:', receiptDate)
    console.log('الفرق بالأيام:', daysDifference)
    
    if (daysDifference > 7) {
      console.error('الإيصال قديم جداً')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'الإيصال قديم جداً. يجب أن يكون الإيصال خلال آخر 7 أيام'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (daysDifference < 0) {
      console.error('تاريخ الإيصال في المستقبل')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'تاريخ الإيصال غير صحيح. لا يمكن أن يكون التاريخ في المستقبل'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من عدم استخدام رقم العملية مسبقاً
    console.log('التحقق من عدم استخدام رقم العملية مسبقاً...')
    const { data: existingTransaction, error: transactionError } = await supabase
      .from('used_receipt_transactions')
      .select('id')
      .eq('transaction_number', transactionNumber)
      .single()

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('خطأ في التحقق من رقم العملية:', transactionError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في التحقق من رقم العملية' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingTransaction) {
      console.error('رقم العملية مستخدم مسبقاً')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'هذا الإيصال تم استخدامه مسبقاً. لا يمكن استخدام نفس الإيصال أكثر من مرة'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // البحث عن رقم المستخدم في النص المستخرج
    console.log('البحث عن رقم المستخدم في البيانات...')
    
    let foundUserId = null
    
    // إذا كان رقم العضوية موجود ومكون من 8 أرقام، استخدمه مباشرة
    if (membershipId && membershipId.length === 8 && /^\d{8}$/.test(membershipId)) {
      // التحقق من وجود رقم العضوية في النص المستخرج
      if (extractedText.includes(membershipId)) {
        foundUserId = membershipId
        console.log('تم العثور على رقم المستخدم من معرف العضوية:', foundUserId)
      } else {
        console.log('رقم العضوية غير موجود في النص المستخرج')
      }
    }

    // إذا لم نجد رقم المستخدم، نبحث عن أرقام 8 أرقام في النص
    if (!foundUserId) {
      const userIdPattern = /\b\d{8}\b/g
      const userIdMatches = [...extractedText.matchAll(userIdPattern)]
      
      if (userIdMatches.length > 0) {
        foundUserId = userIdMatches[0][0]
        console.log('تم العثور على رقم المستخدم من النص المستخرج:', foundUserId)
      }
    }

    if (!foundUserId) {
      console.log('لم يتم العثور على رقم مستخدم صالح')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'تعذر التعرف على رقم المستخدم من الإيصال. تأكد من أن الرقم ظاهر بوضوح في خانة التعليق وأن الصورة عالية الجودة.',
          membershipId: membershipId,
          extractedText: extractedText.substring(0, 500)
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

    // تسجيل رقم العملية كمستخدم
    console.log('تسجيل رقم العملية كمستخدم...')
    const { error: insertTransactionError } = await supabase
      .from('used_receipt_transactions')
      .insert({
        transaction_number: transactionNumber,
        receipt_date: receiptDate,
        user_id: userProfile.user_id
      })

    if (insertTransactionError) {
      console.error('خطأ في تسجيل رقم العملية:', insertTransactionError)
      return new Response(
        JSON.stringify({ success: false, error: 'خطأ في تسجيل رقم العملية' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        status: 'approved',
        verified_at: new Date().toISOString(),
        extracted_text: `رقم المستخدم: ${foundUserId}`,
        transaction_number: transactionNumber,
        receipt_date: receiptDate
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
        transactionNumber: transactionNumber,
        receiptDate: receiptDate,
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
