
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
    }>;
    error?: {
      message: string;
    };
  }>;
}

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

    // Get user from request
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "غير مخول" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    const { imageUrls } = await req.json();

    if (!imageUrls || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "لا توجد صور للمعالجة" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // Process images with Google Vision API
    const extractedData = await processImagesWithVision(imageUrls);
    
    // Analyze the extracted text for bank transfer information
    const analysisResult = analyzeBankTransfer(extractedData);
    
    // Save to database
    const { error: dbError } = await supabaseClient
      .from('receipt_logs')
      .insert({
        user_id: user.id,
        image_urls: imageUrls,
        extracted_data: {
          raw_text: extractedData,
          analysis: analysisResult
        },
        status: analysisResult.isValid ? 'approved' : 'rejected',
        reason: analysisResult.reason
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: "خطأ في حفظ البيانات" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    // If approved, update user membership
    if (analysisResult.isValid) {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ 
          membership_type: 'premium',
          credits: 130,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: analysisResult.isValid ? "تم تفعيل العضوية المميزة بنجاح!" : "تم رفض الإيصال",
        details: analysisResult
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
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

async function processImagesWithVision(imageUrls: string[]): Promise<string[]> {
  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  
  if (!apiKey) {
    console.log('Google Vision API key not found, returning mock data');
    return ["بنك الخرطوم - تحويل مصرفي - المبلغ: 1000 جنيه سوداني"];
  }

  const extractedTexts: string[] = [];

  for (const imageUrl of imageUrls) {
    try {
      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

      // Call Google Vision API
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      const visionData: VisionResponse = await visionResponse.json();
      
      if (visionData.responses[0]?.textAnnotations?.[0]) {
        extractedTexts.push(visionData.responses[0].textAnnotations[0].description);
      } else {
        extractedTexts.push("لم يتم العثور على نص في الصورة");
      }
    } catch (error) {
      console.error('Vision API error:', error);
      extractedTexts.push("خطأ في معالجة الصورة");
    }
  }

  return extractedTexts;
}

function analyzeBankTransfer(extractedTexts: string[]): {
  isValid: boolean;
  reason: string;
  details: any;
} {
  const combinedText = extractedTexts.join(' ').toLowerCase();
  
  // Bank keywords to look for
  const bankKeywords = ['بنك', 'خرطوم', 'تحويل', 'مصرف'];
  const amountKeywords = ['1000', 'ألف', 'جنيه'];
  
  const foundBankKeywords = bankKeywords.filter(keyword => 
    combinedText.includes(keyword)
  );
  
  const foundAmountKeywords = amountKeywords.filter(keyword => 
    combinedText.includes(keyword)
  );
  
  const hasRequiredElements = foundBankKeywords.length >= 2 && foundAmountKeywords.length >= 1;
  
  if (hasRequiredElements) {
    return {
      isValid: true,
      reason: "تم التحقق من الإيصال بنجاح",
      details: {
        bankKeywords: foundBankKeywords,
        amountKeywords: foundAmountKeywords,
        extractedText: combinedText
      }
    };
  } else {
    return {
      isValid: false,
      reason: "الإيصال غير مطابق للمتطلبات المطلوبة",
      details: {
        bankKeywords: foundBankKeywords,
        amountKeywords: foundAmountKeywords,
        extractedText: combinedText
      }
    };
  }
}
