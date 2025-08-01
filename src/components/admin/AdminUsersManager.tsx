
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Crown, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  premium_expires_at?: string;
  user_id_display: string;
  ads_count: number;
}

export const AdminUsersManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل قائمة المستخدمين",
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Users loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUserById = async () => {
    if (!searchId.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          phone,
          city,
          membership_type,
          is_premium,
          points,
          credits,
          created_at,
          premium_expires_at,
          user_id_display
        `)
        .eq('user_id_display', searchId.trim())
        .limit(1);

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "خطأ في البحث",
          description: "فشل في البحث عن المستخدم",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        // Get ads count for the user
        const { data: adsData } = await supabase
          .from('ads')
          .select('id')
          .eq('user_id', data[0].user_id)
          .eq('status', 'active');

        const userWithAdsCount = {
          ...data[0],
          ads_count: adsData?.length || 0
        };

        setSearchResults([userWithAdsCount]);
      } else {
        setSearchResults([]);
        toast({
          title: "لم يتم العثور على المستخدم",
          description: `لا يوجد مستخدم برقم ID: ${searchId}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const upgradeToPremium = async (userId: string) => {
    try {
      // Get admin user ID from session
      const { data: sessionData } = await supabase.auth.getUser();
      const adminUserId = sessionData?.user?.id;

      if (!adminUserId) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من هوية المدير",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      if (error || !data?.success) {
        toast({
          title: "فشل الترقية",
          description: data?.message || "فشل في ترقية المستخدم",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم ترقية المستخدم إلى العضوية المميزة",
        });
        await loadAllUsers();
        if (searchResults.length > 0) {
          await searchUserById();
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderUserRow = (user: UserProfile) => (
    <TableRow key={user.user_id}>
      <TableCell className="font-mono text-sm">{user.user_id_display}</TableCell>
      <TableCell>{user.display_name || 'غير محدد'}</TableCell>
      <TableCell>{user.phone || '-'}</TableCell>
      <TableCell>{user.city || '-'}</TableCell>
      <TableCell>
        <Badge variant={user.membership_type === 'premium' ? 'default' : 'secondary'}>
          {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
        </Badge>
        {user.premium_expires_at && (
          <div className="text-xs text-muted-foreground mt-1">
            ينتهي في {getDaysRemaining(user.premium_expires_at)} يوم
          </div>
        )}
      </TableCell>
      <TableCell>{user.ads_count}</TableCell>
      <TableCell>{user.points}</TableCell>
      <TableCell>{user.credits}</TableCell>
      <TableCell>{formatDate(user.created_at)}</TableCell>
      <TableCell>
        {user.membership_type !== 'premium' && (
          <Button
            size="sm"
            onClick={() => upgradeToPremium(user.user_id)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Crown className="w-4 h-4 ml-1" />
            ترقية
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث عن مستخدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="أدخل رقم ID المكون من 8 خانات"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="max-w-md"
              dir="ltr"
            />
            <Button onClick={searchUserById}>
              <Search className="w-4 h-4 ml-1" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتيجة البحث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>العضوية</TableHead>
                    <TableHead>الإعلانات</TableHead>
                    <TableHead>النقاط</TableHead>
                    <TableHead>الرصيد</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map(renderUserRow)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            جميع المستخدمين
            <Button onClick={loadAllUsers} size="sm" variant="outline" disabled={loading}>
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>العضوية</TableHead>
                  <TableHead>الإعلانات</TableHead>
                  <TableHead>النقاط</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      جاري تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      لا توجد بيانات للعرض
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(renderUserRow)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
