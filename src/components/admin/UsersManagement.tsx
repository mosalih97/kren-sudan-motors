
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, UserPlus, UserMinus, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  premium_expires_at: string | null;
  days_remaining: number | null;
  ads_count: number;
  user_id_display: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchId.trim()) {
      const filtered = users.filter(user => 
        user.user_id_display?.includes(searchId.trim())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchId, users]);

  const fetchUsers = async () => {
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
          upgraded_at,
          premium_expires_at,
          user_id_display
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formattedUsers = (data || []).map(user => ({
        ...user,
        days_remaining: user.premium_expires_at 
          ? Math.ceil((new Date(user.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        ads_count: 0 // We'll calculate this separately or set default
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قائمة المستخدمين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    try {
      const response = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: '00000000-0000-0000-0000-000000000001' // Admin user ID
      });

      const data = response.data as any;

      if (response.error) throw response.error;

      if (data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم ترقية المستخدم إلى العضوية المميزة',
        });
        fetchUsers();
      } else {
        throw new Error(data?.message || 'فشل في ترقية المستخدم');
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في ترقية المستخدم',
        variant: 'destructive',
      });
    }
  };

  const downgradeUser = async (userId: string) => {
    try {
      const response = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: '00000000-0000-0000-0000-000000000001' // Admin user ID
      });

      const data = response.data as any;

      if (response.error) throw response.error;

      if (data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إرجاع المستخدم إلى العضوية العادية',
        });
        fetchUsers();
      } else {
        throw new Error(data?.message || 'فشل في إرجاع المستخدم');
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في إرجاع المستخدم',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل المستخدمين...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
          <p className="text-gray-600 mt-1">إدارة وترقية المستخدمين</p>
        </div>
        <Badge variant="secondary">
          إجمالي المستخدمين: {users.length}
        </Badge>
      </div>

      {/* مربع البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث عن مستخدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="ابحث برقم المستخدم (8 خانات)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="max-w-md"
            />
            {searchId && (
              <Badge variant="outline">
                عدد النتائج: {filteredUsers.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستخدم</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>نوع العضوية</TableHead>
                  <TableHead>النقاط</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>عدد الإعلانات</TableHead>
                  <TableHead>انتهاء الاشتراك</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-mono">
                      {user.user_id_display || 'غير محدد'}
                    </TableCell>
                    <TableCell>{user.display_name || 'غير محدد'}</TableCell>
                    <TableCell>{user.phone || 'غير محدد'}</TableCell>
                    <TableCell>{user.city || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.membership_type === 'premium' ? 'premium' : 'secondary'}
                      >
                        {user.membership_type === 'premium' && <Crown className="h-3 w-3 ml-1" />}
                        {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.points || 0}</TableCell>
                    <TableCell>{user.credits || 0}</TableCell>
                    <TableCell>{user.ads_count || 0}</TableCell>
                    <TableCell>
                      {user.premium_expires_at ? (
                        <div className="text-sm">
                          <div>{new Date(user.premium_expires_at).toLocaleDateString('ar-SA')}</div>
                          <div className="text-gray-500">
                            ({user.days_remaining} يوم متبقي)
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">غير مميز</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.membership_type !== 'premium' ? (
                          <Button
                            size="sm"
                            onClick={() => upgradeUser(user.user_id)}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            <UserPlus className="h-4 w-4 ml-1" />
                            ترقية إلى مميز
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downgradeUser(user.user_id)}
                          >
                            <UserMinus className="h-4 w-4 ml-1" />
                            إلغاء الترقية
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchId ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمون'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;
