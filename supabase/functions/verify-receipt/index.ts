
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
    
    const { user_id, white_image_url, green_image_url } = requestBody
    
    console.log('معرف المستخدم:', user_id)
    console.log('رابط الإيصال الأبيض:', white_image_url)
    console.log('رابط الإيصال الأخضر:', green_image_url)
    
    // التحقق من وجود جميع البيانات المطلوبة
    if (!user_id || !white_image_url || !green_image_url) {
      console.error('بيانات مفقودة')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'يرجى إدخال جميع البيانات المطلوبة' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // التحقق من صحة معرف المستخدم (8 خانات)
    if (!/^\d{8}$/.test(user_id)) {
      console.error('معرف المستخدم غير صحيح')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'معرف المستخدم يجب أن يكون مكون من 8 أرقام' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إعداد Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('تنزيل الصورتين...')
    
    // تنزيل الصورتين
    const [whiteResponse, greenResponse] = await Promise.all([
      fetch(white_image_url),
      fetch(green_image_url)
    ])

    if (!whiteResponse.ok || !greenResponse.ok) {
      console.error('فشل في تنزيل الصور')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'فشل في تنزيل الصور. تأكد من صحة الروابط' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('تحويل الصور إلى base64...')
    
    // تحويل الصور إلى base64
    const whiteBuffer = await whiteResponse.arrayBuffer()
    const greenBuffer = await greenResponse.arrayBuffer()
    
    const whiteBase64 = btoa(String.fromCharCode(...new Uint8Array(whiteBuffer)))
    const greenBase64 = btoa(String.fromCharCode(...new Uint8Array(greenBuffer)))

    console.log('استخدام Google Vision API...')
    
    // استخدام Google Vision API
    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    
    if (!visionApiKey) {
      console.error('Google Vision API Key مفقود')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'خطأ في الخادم: Google Vision API Key غير متوفر' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // تحليل الصورة البيضاء
    const whiteVisionResponse = await fetch(
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
                content: whiteBase64,
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

    // تحليل الصورة الخضراء
    const greenVisionResponse = await fetch(
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
                content: greenBase64,
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

    if (!whiteVisionResponse.ok || !greenVisionResponse.ok) {
      console.error('فشل في تحليل الصور')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'فشل في تحليل الصور. تأكد من وضوح الصور' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const whiteVisionData = await whiteVisionResponse.json()
    const greenVisionData = await greenVisionResponse.json()

    console.log('نتيجة تحليل الصورة البيضاء:', JSON.stringify(whiteVisionData, null, 2))
    console.log('نتيجة تحليل الصورة الخضراء:', JSON.stringify(greenVisionData, null, 2))

    // استخراج النص من الصورتين
    const whiteText = whiteVisionData.responses?.[0]?.textAnnotations?.[0]?.description || ''
    const greenText = greenVisionData.responses?.[0]?.textAnnotations?.[0]?.description || ''
    
    console.log('النص المستخرج من الصورة البيضاء:', whiteText)
    console.log('النص المستخرج من الصورة الخضراء:', greenText)

    if (!whiteText && !greenText) {
      console.error('لم يتم العثور على نص في الصور')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'لم يتم العثور على نص في الصور. تأكد من وضوح الصور' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // دمج النصين للبحث
    const combinedText = `${whiteText}\n${greenText}`
    console.log('النص المدمج:', combinedText)

    // استخراج رقم العملية (11 رقم)
    const transactionMatches = combinedText.match(/\b\d{11}\b/g)
    if (!transactionMatches || transactionMatches.length === 0) {
      console.error('لم يتم العثور على رقم العملية')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'لم يتم العثور على رقم العملية (11 رقم). تأكد من وضوح الصورة' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const transactionId = transactionMatches[0]
    console.log('رقم العملية المستخرج:', transactionId)

    // استخراج التاريخ بصيغة مختلفة
    const datePatterns = [
      /\b(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\b/g,
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\b/g,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\b/g,
    ]

    let transactionDate = null
    
    for (const pattern of datePatterns) {
      const matches = [...combinedText.matchAll(pattern)]
      if (matches.length > 0) {
        const match = matches[0]
        
        if (pattern.source.includes('([A-Za-z]{3})')) {
          // تنسيق DD-MMM-YYYY HH:MM:SS
          const day = match[1]
          const month = match[2]
          const year = match[3]
          const hour = match[4]
          const minute = match[5]
          const second = match[6]
          
          const monthMap: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          }
          
          const monthNumber = monthMap[month]
          if (monthNumber) {
            transactionDate = new Date(`${year}-${monthNumber}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}`)
          }
        } else {
          // تنسيق آخر
          transactionDate = new Date(match[0])
        }
        
        if (transactionDate && !isNaN(transactionDate.getTime())) {
          console.log('تاريخ العملية المستخرج:', transactionDate)
          break
        }
      }
    }

    if (!transactionDate) {
      console.error('لم يتم العثور على تاريخ العملية')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'لم يتم العثور على تاريخ العملية. تأكد من وضوح الصورة' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // التحقق من أن العملية خلال 24 ساعة
    const now = new Date()
    const timeDifference = now.getTime() - transactionDate.getTime()
    const hoursDifference = timeDifference / (1000 * 60 * 60)

    console.log('الوقت الحالي:', now)
    console.log('وقت العملية:', transactionDate)
    console.log('الفرق بالساعات:', hoursDifference)

    if (hoursDifference > 24) {
      console.error('العملية أقدم من 24 ساعة')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'العملية أقدم من 24 ساعة. يجب أن تكون العملية خلال آخر 24 ساعة' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // التحقق من رقم الحساب
    const accountNumber = '0913036899290001'
    if (!combinedText.includes(accountNumber)) {
      console.error('رقم الحساب غير مطابق')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'رقم الحساب غير مطابق. تأكد من التحويل إلى الحساب الصحيح' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('التحقق من عدم استخدام رقم العملية مسبقاً...')
    
    // التحقق من عدم استخدام رقم العملية مسبقاً
    const { data: existingTransaction, error: transactionError } = await supabase
      .from('used_transaction_ids')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('خطأ في التحقق من رقم العملية:', transactionError)
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'خطأ في التحقق من رقم العملية' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingTransaction) {
      console.error('رقم العملية مكرر')
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'رقم العملية مكرر. تم استخدام هذا الإيصال مسبقاً' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('إضافة رقم العملية إلى قاعدة البيانات...')
    
    // إضافة رقم العملية إلى قاعدة البيانات
    const { error: insertTransactionError } = await supabase
      .from('used_transaction_ids')
      .insert({
        transaction_id: transactionId,
        user_id: user_id
      })

    if (insertTransactionError) {
      console.error('خطأ في إضافة رقم العملية:', insertTransactionError)
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'خطأ في حفظ رقم العملية' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('إضافة الإيصال إلى قاعدة البيانات...')
    
    // إضافة الإيصال إلى قاعدة البيانات
    const { error: insertReceiptError } = await supabase
      .from('payment_receipts')
      .insert({
        user_id: user_id,
        transaction_id: transactionId,
        white_image_url: white_image_url,
        green_image_url: green_image_url,
        date_of_payment: transactionDate.toISOString(),
        verified: true
      })

    if (insertReceiptError) {
      console.error('خطأ في إضافة الإيصال:', insertReceiptError)
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          message: 'خطأ في حفظ الإيصال' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('تم التحقق من الإيصال بنجاح')
    
    // إرجاع رد ناجح
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'تم التحقق من الإيصال بنجاح',
        data: {
          transaction_id: transactionId,
          date_of_payment: transactionDate.toISOString(),
          user_id: user_id
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('خطأ عام في دالة verify-receipt:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        status: 'failed',
        message: 'حدث خطأ أثناء التحقق من الإيصال',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
