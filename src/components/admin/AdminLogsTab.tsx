
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowUp, ArrowDown, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UpgradeLog {
  id: string;
  user_id: string;
  admin_id: string;
  action: string;
  from_membership: string;
  to_membership: string;
  created_at: string;
  expires_at?: string;
  notes?: string;
}

export const AdminLogsTab = () => {
  // جلب سجلات الترقية
  const { data: upgradeLogs, isLoading } = useQuery({
    queryKey: ['admin-upgrade-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upgrade_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UpgradeLog[];
    },
  });

  // جلب بيانات المستخدمين والإداريين
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone');
      
      if (error) throw error;
      return data;
    },
  });

  const getUserProfile = (userId: string) => {
    return profiles?.find(p => p.user_id === userId);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'upgrade':
        return (
          <Badge className="bg-green-500">
            <ArrowUp className="h-3 w-3 mr-1" />
            ترقية
          </Badge>
        );
      case 'downgrade':
        return (
          <Badge className="bg-red-500">
            <ArrowDown className="h-3 w-3 mr-1" />
            إرجاع
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getMembershipBadge = (membership: string) => {
    switch (membership) {
      case 'premium':
        return <Badge className="bg-yellow-500">مميز</Badge>;
      case 'free':
        return <Badge variant="secondary">عادي</Badge>;
      case 'admin':
        return <Badge className="bg-purple-500">إداري</Badge>;
      default:
        return <Badge variant="outline">{membership}</Badge>;
    }
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
      {/* إحصائيات السجلات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">إجمالي الترقيات</p>
                <p className="text-2xl font-bold text-green-900">
                  {upgradeLogs?.filter(log => log.action === 'upgrade').length || 0}
                </p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">إجمالي الإرجاعات</p>
                <p className="text-2xl font-bold text-red-900">
                  {upgradeLogs?.filter(log => log.action === 'downgrade').length || 0}
                </p>
              </div>
              <ArrowDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول السجلات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            سجلات الترقية والإرجاع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العملية</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>المدير</TableHead>
                  <TableHead>تاريخ انتهاء العضوية</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upgradeLogs?.map((log) => {
                  const userProfile = getUserProfile(log.user_id);
                  const adminProfile = getUserProfile(log.admin_id);
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {userProfile?.display_name || 'غير محدد'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {userProfile?.phone}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getMembershipBadge(log.from_membership)}
                      </TableCell>
                      
                      <TableCell>
                        {getMembershipBadge(log.to_membership)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {adminProfile?.display_name || 'غير محدد'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(log.expires_at), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">لا يوجد</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {log.notes || 'لا توجد ملاحظات'}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
