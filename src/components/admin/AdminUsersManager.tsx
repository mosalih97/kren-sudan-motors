
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Crown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface UserProfile {
  user_id: string;
  user_id_display: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  upgraded_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
}

export const AdminUsersManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();
  const { sessionToken } = useAdminAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchId.trim()) {
      setFilteredUsers(users.filter(user => 
        user.user_id_display?.includes(searchId.trim())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchId, users]);

  const loadUsers = async () => {
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
        // Cast the data to the expected type and add user_id_display
        const rawUsers = data as Array<{
          user_id: string;
          display_name: string;
          phone: string;
          city: string;
          membership_type: string;
          is_premium: boolean;
          points: number;
          credits: number;
          created_at: string;
          upgraded_at: string;
          premium_expires_at: string;
          days_remaining: number;
          ads_count: number;
        }>;

        const usersWithDisplay = rawUsers.map((user) => ({
          ...user,
          user_id_display: user.user_id.slice(-8) // Use last 8 characters of UUID as display ID
        }));
        
        setUsers(usersWithDisplay);
      }
    } catch (error) {
      console.error('Users loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: 'current_admin_id' // This should be the actual admin ID
      });

      if (error || !data) {
        toast({
          title: "فشل الترقية",
          description: "حدث خطأ أثناء ترقية المستخدم",
          variant: "destructive",
        });
      } else {
        const result = data as { success?: boolean; message?: string };
        if (!result?.success) {
          toast({
            title: "فشل الترقية",
            description: result?.message || "حدث خطأ أثناء ترقية المستخدم",
            variant: "destructive",
          });
        } else {
          toast({
            title: "تم بنجاح",
            description: "تم ترقية المستخدم إلى العضوية المميزة",
          });
          loadUsers(); // Reload the users list
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "خطأ",
        description: "فشل في ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">جاري تحميل المستخدمين...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين</CardTitle>
          <CardDescription>
            البحث وإدارة المستخدمين في التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 rtl:space-x-reverse mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم المستخدم (8 خانات)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pr-10"
                maxLength={8}
              />
            </div>
          </div>

          <div className="rounded-md border">
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
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-mono">{user.user_id_display}</TableCell>
                      <TableCell>{user.display_name || 'غير محدد'}</TableCell>
                      <TableCell>{user.phone || 'غير محدد'}</TableCell>
                      <TableCell>{user.city || 'غير محدد'}</TableCell>
                      <TableCell>
                        <Badge variant={user.membership_type === 'premium' ? 'default' : 'secondary'}>
                          {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.points}</TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>{user.ads_count}</TableCell>
                      <TableCell>
                        {user.premium_expires_at ? (
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(user.premium_expires_at)}</span>
                            {user.days_remaining > 0 && (
                              <Badge variant="outline">
                                {user.days_remaining} يوم
                              </Badge>
                            )}
                          </div>
                        ) : (
                          'غير محدد'
                        )}
                      </TableCell>
                      <TableCell>
                        {user.membership_type !== 'premium' && (
                          <Button
                            size="sm"
                            onClick={() => upgradeUser(user.user_id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse"
                          >
                            <Crown className="h-3 w-3" />
                            <span>ترقية إلى مميز</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
