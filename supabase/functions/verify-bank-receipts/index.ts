
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// بيانات الحساب المستفيد المطلوبة
const EXPECTED_ACCOUNT_NUMBER = "0913 0368 9929 0001"
const EXPECTED_BENEFICIARY_NAME = "محمد الأمين منتصر صالح عبدالقادر"
const EXPECTED_AMOUNT = "25000"
const EXPECTED_AMOUNT_ALT = "25,000"

// دالة حساب المسافة بين النصوص (Levenshtein distance)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// دالة التحقق من تشابه الأسماء
function isNameSimilar(extractedName: string, expectedName: string): boolean {
  const distance = levenshteinDistance(extractedName.toLowerCase(), expectedName.toLowerCase());
  const maxLength = Math.max(extractedName.length, expectedName.length);
  const similarity = (maxLength - distance) / maxLength;
  return similarity > 0.7; // 70% تشابه على الأقل
}

// دالة إنشاء JWT للمصادقة مع Google
function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlEncode(str: string): string {
  return base64urlEscape(btoa(str));
}

async function createJWT(serviceAccount: any): Promise<string> {
  const header = {
    "alg": "RS256",
    "typ": "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    "iss": serviceAccount.client_email,
    "scope": "https://www.googleapis.com/auth/cloud-platform",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": now + 3600,
    "iat": now
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // إعداد المفتاح الخاص للتوقيع
  const privateKeyPem = serviceAccount.private_key;
  const privateKeyBuffer = new TextEncoder().encode(privateKeyPem);
  
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEscape(btoa(String.fromCharCode(...new Uint8Array(signature))));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// دالة الحصول على Access Token من Google
async function getAccessToken(): Promise<string> {
  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    
    if (!serviceAccountJson) {
      throw new Error('Google Service Account JSON not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const jwt = await createJWT(serviceAccount);

    // استبدال JWT بـ access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// دالة استخراج النصوص من الصورة باستخدام Google Vision API
async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: imageBase64
          },
          features: [{
            type: 'TEXT_DETECTION'
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      return data.responses[0].textAnnotations[0].description || '';
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

// دالة التحقق من صحة الإيصال
function validateReceipt(extractedText: string, userIdDisplay: string): { isValid: boolean, reason: string } {
  console.log('Extracted text:', extractedText);
  console.log('Looking for user ID:', userIdDisplay);
  
  // التحقق من رقم الحساب
  if (!extractedText.includes(EXPECTED_ACCOUNT_NUMBER.replace(/\s/g, '')) && 
      !extractedText.includes(EXPECTED_ACCOUNT_NUMBER)) {
    return { isValid: false, reason: "رقم الحساب المستفيد غير صحيح" };
  }

  // التحقق من المبلغ
  if (!extractedText.includes(EXPECTED_AMOUNT) && !extractedText.includes(EXPECTED_AMOUNT_ALT)) {
    return { isValid: false, reason: "لم يتم العثور على مبلغ التحويل المطلوب (25,000 جنيه)" };
  }

  // التحقق من رقم العضوية في خانة التعليق
  if (!extractedText.includes(userIdDisplay)) {
    return { isValid: false, reason: "رقم العضوية غير موجود في الإيصال" };
  }

  // التحقق من اسم المستفيد (تقريبي)
  const nameFound = extractedText.split('\n').some(line => 
    isNameSimilar(line.trim(), EXPECTED_BENEFICIARY_NAME)
  );

  if (!nameFound) {
    return { isValid: false, reason: "اسم المستفيد غير مطابق" };
  }

  return { isValid: true, reason: "تم التحقق بنجاح" };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // التحقق من المصادقة
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formData = await req.formData()
    const greenReceipt = formData.get('greenReceipt') as File
    const whiteReceipt = formData.get('whiteReceipt') as File

    if (!greenReceipt || !whiteReceipt) {
      return new Response(JSON.stringify({ error: 'يجب رفع الإيصالين (الأخضر والأبيض)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // التحقق من حجم الملفات
    if (greenReceipt.size > 5 * 1024 * 1024 || whiteReceipt.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // التحقق من نوع الملفات
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(greenReceipt.type) || !allowedTypes.includes(whiteReceipt.type)) {
      return new Response(JSON.stringify({ error: 'نوع الملف يجب أن يكون JPG أو PNG' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // الحصول على معلومات المستخدم
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id_display')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'لم يتم العثور على بيانات المستخدم' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // رفع الملفات إلى Storage
    const greenFileName = `${user.id}/green_${Date.now()}.${greenReceipt.type.split('/')[1]}`
    const whiteFileName = `${user.id}/white_${Date.now()}.${whiteReceipt.type.split('/')[1]}`

    const [greenUpload, whiteUpload] = await Promise.all([
      supabaseClient.storage.from('bank-receipts').upload(greenFileName, greenReceipt),
      supabaseClient.storage.from('bank-receipts').upload(whiteFileName, whiteReceipt)
    ])

    if (greenUpload.error || whiteUpload.error) {
      console.error('Upload errors:', greenUpload.error, whiteUpload.error);
      return new Response(JSON.stringify({ error: 'فشل في رفع الملفات' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // تحويل الملفات إلى base64
    const greenArrayBuffer = await greenReceipt.arrayBuffer()
    const whiteArrayBuffer = await whiteReceipt.arrayBuffer()
    const greenBase64 = btoa(String.fromCharCode(...new Uint8Array(greenArrayBuffer)))
    const whiteBase64 = btoa(String.fromCharCode(...new Uint8Array(whiteArrayBuffer)))

    // استخراج النصوص من الصورتين
    const [greenText, whiteText] = await Promise.all([
      extractTextFromImage(greenBase64),
      extractTextFromImage(whiteBase64)
    ])

    const combinedText = `${greenText}\n${whiteText}`

    // التحقق من صحة البيانات
    const validation = validateReceipt(combinedText, profile.user_id_display)

    const imageUrls = [
      `bank-receipts/${greenFileName}`,
      `bank-receipts/${whiteFileName}`
    ]

    if (validation.isValid) {
      // تحديث العضوية إلى مميزة
      const expirationDate = new Date()
      expirationDate.setMonth(expirationDate.getMonth() + 1)

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          membership_type: 'premium',
          is_premium: true,
          premium_expires_at: expirationDate.toISOString(),
          credits: 130,
          monthly_ads_count: 0,
          last_monthly_reset: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return new Response(JSON.stringify({ error: 'فشل في تحديث العضوية' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // حفظ سجل النجاح
      await supabaseClient.from('receipt_logs').insert({
        user_id: user.id,
        image_urls: imageUrls,
        status: 'success',
        reason: 'verified',
        extracted_data: { greenText, whiteText, userIdDisplay: profile.user_id_display }
      })

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'تم تفعيل العضوية المميزة بنجاح! مرحباً بك في عضوية الكرين المميزة' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // حفظ سجل الفشل
      await supabaseClient.from('receipt_logs').insert({
        user_id: user.id,
        image_urls: imageUrls,
        status: 'failed',
        reason: validation.reason,
        extracted_data: { greenText, whiteText, userIdDisplay: profile.user_id_display }
      })

      return new Response(JSON.stringify({ 
        success: false, 
        message: validation.reason 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Error in verify-bank-receipts:', error)
    return new Response(JSON.stringify({ error: 'حدث خطأ في النظام' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
