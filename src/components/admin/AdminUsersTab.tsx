
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, UserMinus, Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface User {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  credits: number;
  points: number;
}

interface AdminUsersTabProps {
  onStatsUpdate: () => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone, city, membership_type, is_premium, premium_expires_at, created_at, credits, points')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المستخدمين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "نجح",
          description: result.message
        });
        await fetchUsers();
        onStatsUpdate();
      } else {
        toast({
          title: "خطأ",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
    }
  };

  const downgradeUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "نجح",
          description: result.message
        });
        await fetchUsers();
        onStatsUpdate();
      } else {
        toast({
          title: "خطأ",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء ترقية المستخدم",
        variant: "destructive"
      });
    }
  };

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm) ||
                         user.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && user.membership_type === 'premium') ||
                         (filterType === 'free' && user.membership_type === 'free');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
            >
              الكل
            </Button>
            <Button
              variant={filterType === 'premium' ? 'default' : 'outline'}
              onClick={() => setFilterType('premium')}
            >
              مميز
            </Button>
            <Button
              variant={filterType === 'free' ? 'default' : 'outline'}
              onClick={() => setFilterType('free')}
            >
              عادي
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>نوع العضوية</TableHead>
                <TableHead>النقاط</TableHead>
                <TableHead>الوقت المتبقي</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const remainingDays = getRemainingDays(user.premium_expires_at);
                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{user.display_name || 'غير محدد'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || 'غير محدد'}</TableCell>
                    <TableCell>{user.city || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant={user.membership_type === 'premium' ? 'default' : 'secondary'}>
                        {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>أساسي: {user.points}</div>
                        {user.membership_type === 'premium' && (
                          <div className="text-yellow-600">مميز: {user.credits}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.membership_type === 'premium' && remainingDays !== null ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={remainingDays < 7 ? 'text-red-600' : 'text-green-600'}>
                            {remainingDays} يوم
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.membership_type === 'free' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-600">
                                <UserPlus className="h-4 w-4 ml-1" />
                                ترقية
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الترقية</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من ترقية المستخدم {user.display_name} إلى العضوية المميزة لمدة 30 يومًا؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => upgradeUser(user.user_id)}>
                                  تأكيد الترقية
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <UserMinus className="h-4 w-4 ml-1" />
                                إلغاء الترقية
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد إلغاء الترقية</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من إلغاء العضوية المميزة للمستخدم {user.display_name}؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => downgradeUser(user.user_id)}>
                                  تأكيد الإلغاء
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد مستخدمين
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUsersTab;
