
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  upgraded_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
}

interface AdminResponse {
  success: boolean;
  message: string;
}

interface AdminUsersTabProps {
  onStatsUpdate: () => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب قائمة المستخدمين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeUser = async (targetUserId: string) => {
    if (!user) return;
    
    setProcessingUser(targetUserId);
    
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: targetUserId,
        admin_user_id: user.id
      });

      if (error) throw error;

      const response = data as AdminResponse;

      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: response.message
        });
        fetchUsers();
        onStatsUpdate();
      } else {
        toast({
          title: "خطأ في الترقية",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDowngradeUser = async (targetUserId: string) => {
    if (!user) return;
    
    setProcessingUser(targetUserId);
    
    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: targetUserId,
        admin_user_id: user.id
      });

      if (error) throw error;

      const response = data as AdminResponse;

      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: response.message
        });
        fetchUsers();
        onStatsUpdate();
      } else {
        toast({
          title: "خطأ في إلغاء الترقية",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        title: "خطأ في إلغاء الترقية",
        description: "حدث خطأ أثناء إلغاء ترقية المستخدم",
        variant: "destructive"
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm) ||
                         user.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = membershipFilter === 'all' || user.membership_type === membershipFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getMembershipBadge = (membershipType: string, daysRemaining: number) => {
    if (membershipType === 'premium') {
      return (
        <Badge variant="default" className="bg-yellow-500">
          مميز ({daysRemaining} يوم)
        </Badge>
      );
    }
    if (membershipType === 'admin') {
      return <Badge variant="destructive">مدير</Badge>;
    }
    return <Badge variant="secondary">عادي</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          إدارة المستخدمين
        </CardTitle>
        
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الهاتف أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب العضوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع العضويات</SelectItem>
              <SelectItem value="free">عضوية عادية</SelectItem>
              <SelectItem value="premium">عضوية مميزة</SelectItem>
              <SelectItem value="admin">مدير</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>نوع العضوية</TableHead>
                <TableHead>النقاط</TableHead>
                <TableHead>الكريديت</TableHead>
                <TableHead>الإعلانات</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {user.display_name || 'غير محدد'}
                  </TableCell>
                  <TableCell>{user.phone || 'غير محدد'}</TableCell>
                  <TableCell>{user.city || 'غير محدد'}</TableCell>
                  <TableCell>
                    {getMembershipBadge(user.membership_type, user.days_remaining)}
                  </TableCell>
                  <TableCell>{user.points || 0}</TableCell>
                  <TableCell>{user.credits || 0}</TableCell>
                  <TableCell>{user.ads_count || 0}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.membership_type === 'free' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpgradeUser(user.user_id)}
                          disabled={processingUser === user.user_id}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          ترقية
                        </Button>
                      )}
                      
                      {user.membership_type === 'premium' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDowngradeUser(user.user_id)}
                          disabled={processingUser === user.user_id}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          إلغاء ترقية
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
          <div className="text-center py-8 text-muted-foreground">
            لا توجد نتائج للبحث
          </div>
        )}
      </CardContent>
    </Card>
  );
};
