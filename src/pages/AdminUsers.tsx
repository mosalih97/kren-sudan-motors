
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Loader2, Crown, Users, Calendar, Phone, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات المستخدمين",
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: result.message,
        });
        fetchUsers(); // Refresh the list
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const downgradeUser = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: result.message,
        });
        fetchUsers(); // Refresh the list
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الإرجاع",
        description: "حدث خطأ أثناء إرجاع المستخدم للعضوية العادية",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getMembershipBadge = (membershipType: string, isPremium: boolean) => {
    if (membershipType === 'admin') {
      return <Badge variant="destructive">إداري</Badge>;
    }
    if (membershipType === 'premium' || isPremium) {
      return <Badge variant="default" className="bg-yellow-500 text-white">مميز</Badge>;
    }
    return <Badge variant="outline">عادي</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              إدارة المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>العضوية</TableHead>
                    <TableHead>النقاط</TableHead>
                    <TableHead>الكريديت</TableHead>
                    <TableHead>الإعلانات</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow key={userData.user_id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{userData.display_name || 'غير محدد'}</div>
                          {userData.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {userData.phone}
                            </div>
                          )}
                          {userData.city && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {userData.city}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getMembershipBadge(userData.membership_type, userData.is_premium)}
                          {userData.premium_expires_at && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              ينتهي في {userData.days_remaining} يوم
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{userData.points}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {userData.credits}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{userData.ads_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(userData.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {userData.membership_type !== 'premium' && userData.membership_type !== 'admin' ? (
                            <Button
                              size="sm"
                              onClick={() => upgradeUser(userData.user_id)}
                              disabled={actionLoading === userData.user_id}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              {actionLoading === userData.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Crown className="h-4 w-4 mr-1" />
                                  ترقية
                                </>
                              )}
                            </Button>
                          ) : (
                            userData.membership_type === 'premium' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downgradeUser(userData.user_id)}
                                disabled={actionLoading === userData.user_id}
                              >
                                {actionLoading === userData.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'إرجاع لعادي'
                                )}
                              </Button>
                            )
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
    </div>
  );
};

export default AdminUsers;
