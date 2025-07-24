
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface BoostAdRequest {
  ad_id: string;
  boost_type_id: string;
}

interface BoostAdResponse {
  success: boolean;
  message: string;
  end_time?: string;
  cost?: number;
}

export function useBoostAd() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const boostAdMutation = useMutation({
    mutationFn: async ({ ad_id, boost_type_id }: BoostAdRequest): Promise<BoostAdResponse> => {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        body: { ad_id, boost_type_id }
      });

      if (error) {
        throw new Error(error.message || 'خطأ في تعزيز الإعلان');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم التعزيز بنجاح",
          description: data.message,
        });
        
        // تحديث البيانات
        queryClient.invalidateQueries({ queryKey: ['user-points'] });
        queryClient.invalidateQueries({ queryKey: ['ads'] });
      } else {
        toast({
          title: "فشل التعزيز",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في التعزيز",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    boostAd: boostAdMutation.mutate,
    isLoading: boostAdMutation.isPending,
    error: boostAdMutation.error,
  };
}

export function useBoostTypes() {
  return useQuery<BoostType[]>({
    queryKey: ['boost-types'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        method: 'GET'
      });

      if (error) {
        throw new Error(error.message || 'خطأ في جلب أنواع التعزيز');
      }

      return data.boost_types;
    },
  });
}

export function useBoostStats(userId: string) {
  return useQuery({
    queryKey: ['boost-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_boost_stats', {
        user_id_param: userId
      });

      if (error) {
        throw new Error(error.message || 'خطأ في جلب إحصائيات التعزيز');
      }

      return data;
    },
    enabled: !!userId,
  });
}
