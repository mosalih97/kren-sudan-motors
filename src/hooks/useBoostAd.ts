
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BoostType {
  id: string;
  label: string;
  duration_hours: number;
  points_cost: number;
  features: {
    description: string;
    view_increase: number;
    priority: number;
    badge?: string;
  };
}

interface BoostResult {
  success: boolean;
  message: string;
  end_time?: string;
  cost?: number;
}

export function useBoostAd() {
  const [loading, setLoading] = useState(false);
  const [boostTypes, setBoostTypes] = useState<BoostType[]>([]);
  const { toast } = useToast();

  const fetchBoostTypes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching boost types:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب أنواع التعزيز",
          variant: "destructive"
        });
        return;
      }

      setBoostTypes(data.boost_types || []);
    } catch (error) {
      console.error('Error fetching boost types:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب أنواع التعزيز",
        variant: "destructive"
      });
    }
  };

  const boostAd = async (adId: string, boostTypeId: string): Promise<BoostResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        method: 'POST',
        body: {
          ad_id: adId,
          boost_type_id: boostTypeId
        }
      });

      if (error) {
        console.error('Error boosting ad:', error);
        toast({
          title: "خطأ",
          description: "فشل في تعزيز الإعلان",
          variant: "destructive"
        });
        return { success: false, message: "فشل في تعزيز الإعلان" };
      }

      if (data.success) {
        toast({
          title: "نجح التعزيز",
          description: data.message,
          variant: "default"
        });
      } else {
        toast({
          title: "فشل التعزيز",
          description: data.message,
          variant: "destructive"
        });
      }

      return data;
    } catch (error) {
      console.error('Error boosting ad:', error);
      toast({
        title: "خطأ",
        description: "فشل في تعزيز الإعلان",
        variant: "destructive"
      });
      return { success: false, message: "فشل في تعزيز الإعلان" };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    boostTypes,
    fetchBoostTypes,
    boostAd
  };
}
