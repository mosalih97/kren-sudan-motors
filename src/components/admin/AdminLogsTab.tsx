
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UpgradeLog {
  id: string;
  user_id: string;
  upgraded_by: string;
  action: string;
  from_membership: string;
  to_membership: string;
  upgraded_at: string;
  expires_at: string | null;
  notes: string | null;
  user_profile: {
    display_name: string;
  } | null;
  admin_profile: {
    display_name: string;
  } | null;
}

const AdminLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<UpgradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('upgrade_logs')
        .select(`
          id,
          user_id,
          upgraded_by,
          action,
          from_membership,
          to_membership,
          upgraded_at,
          expires_at,
          notes
        `)
        .order('upgraded_at', { ascending: false });

      if (error) throw error;

      // جلب أسماء المستخدمين والإداريين
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          const [userProfile, adminProfile] = await Promise.all([
            supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', log.user_id)
              .single(),
            supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', log.upgraded_by)
              .single()
          ]);

          return {
            ...log,
            user_profile: userProfile.data,
            admin_profile: adminProfile.data
          };
        })
      );

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب سجلات الترقية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجلات الترقية</CardTitle>
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
        <CardTitle>سجلات الترقية</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراء</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>تم بواسطة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الأيام المتبقية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const remainingDays = getRemainingDays(log.expires_at);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.action === 'upgrade' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={log.action === 'upgrade' ? 'default' : 'destructive'}>
                          {log.action === 'upgrade' ? 'ترقية' : 'إلغاء ترقية'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {log.user_profile?.display_name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {log.from_membership === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.to_membership === 'premium' ? 'default' : 'secondary'}>
                        {log.to_membership === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.admin_profile?.display_name || 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(log.upgraded_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.expires_at ? formatDate(log.expires_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {remainingDays !== null ? (
                        <span className={remainingDays < 7 ? 'text-red-600' : 'text-green-600'}>
                          {remainingDays} يوم
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminLogsTab;
