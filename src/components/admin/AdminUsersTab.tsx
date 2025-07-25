
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Crown, UserX, User, Calendar, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfile {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  upgraded_at?: string;
  premium_expires_at?: string;
  days_remaining?: number;
  ads_count: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  expires_at?: string;
}

export const AdminUsersTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // جلب قائمة المستخدمين
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // فلترة المستخدمين حسب البحث
  const filteredUsers = users?.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ترقية المستخدم
  const upgradeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: targetUserId,
        admin_user_id: user?.id
      });
      if (error) throw error;
      return data as ApiResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم بنجاح",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      } else {
        toast({
          title: "خطأ",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في العملية",
        variant: "destructive",
      });
      console.error('Upgrade error:', error);
    },
  });

  // إرجاع المستخدم إلى free
  const downgradeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: targetUserId,
        admin_user_id: user?.id
      });
      if (error) throw error;
      return data as ApiResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم بنجاح",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      } else {
        toast({
          title: "خطأ",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في العملية",
        variant: "destructive",
      });
      console.error('Downgrade error:', error);
    },
  });

  const getMembershipBadge = (membershipType: string, daysRemaining?: number) => {
    if (membershipType === 'premium') {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          مميز {daysRemaining && `(${daysRemaining} يوم متبقي)`}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        عادي
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث في المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو الهاتف أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({filteredUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>العضوية</TableHead>
                  <TableHead>النقاط</TableHead>
                  <TableHead>الإعلانات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((userProfile) => (
                  <TableRow key={userProfile.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {userProfile.display_name || 'غير محدد'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {userProfile.phone || 'غير محدد'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {userProfile.city || 'غير محدد'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getMembershipBadge(userProfile.membership_type, userProfile.days_remaining)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">أساسي: {userProfile.points}</div>
                        <div className="text-sm text-muted-foreground">كريديت: {userProfile.credits}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{userProfile.ads_count}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(userProfile.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-x-2">
                        {userProfile.membership_type === 'premium' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downgradeMutation.mutate(userProfile.user_id)}
                            disabled={downgradeMutation.isPending}
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            إرجاع لعادي
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => upgradeMutation.mutate(userProfile.user_id)}
                            disabled={upgradeMutation.isPending}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            ترقية لمميز
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
