
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UpgradeLog {
  id: string;
  user_id: string;
  admin_id: string;
  action: string;
  from_membership: string;
  to_membership: string;
  expires_at: string;
  created_at: string;
  notes: string;
}

export const AdminLogsTab: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<UpgradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('upgrade_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب سجل العمليات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'upgrade':
        return <Badge variant="default">ترقية</Badge>;
      case 'downgrade':
        return <Badge variant="secondary">إلغاء ترقية</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getMembershipText = (membership: string) => {
    switch (membership) {
      case 'free':
        return 'عضوية عادية';
      case 'premium':
        return 'عضوية مميزة';
      case 'admin':
        return 'مدير';
      default:
        return membership;
    }
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
          <Activity className="h-5 w-5" />
          سجل عمليات الترقية والإلغاء
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نوع العملية</TableHead>
                <TableHead>معرف المستخدم</TableHead>
                <TableHead>معرف المدير</TableHead>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>تاريخ العملية</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.admin_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {getMembershipText(log.from_membership)}
                  </TableCell>
                  <TableCell>
                    {getMembershipText(log.to_membership)}
                  </TableCell>
                  <TableCell>
                    {log.expires_at ? format(new Date(log.expires_at), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    {log.notes || 'لا توجد ملاحظات'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عمليات مسجلة
          </div>
        )}
      </CardContent>
    </Card>
  );
};
