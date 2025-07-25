
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface UpgradeLog {
  id: string;
  user_id: string;
  upgraded_by: string | null;
  action: string;
  from_membership: string;
  to_membership: string;
  upgraded_at: string;
  expires_at: string | null;
  notes: string | null;
  user_profile?: {
    display_name: string;
  };
  admin_profile?: {
    display_name: string;
  };
}

export const AdminLogsTab = () => {
  const [logs, setLogs] = useState<UpgradeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: logsData, error } = await supabase
        .from("upgrade_logs")
        .select(`
          *,
          user_profile:profiles!upgrade_logs_user_id_fkey(display_name),
          admin_profile:profiles!upgrade_logs_upgraded_by_fkey(display_name)
        `)
        .order("upgraded_at", { ascending: false });

      if (error) throw error;
      setLogs(logsData || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("فشل في جلب سجلات الترقية");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_profile?.display_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) || false;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "upgrade":
        return <Badge variant="default">ترقية</Badge>;
      case "downgrade":
        return <Badge variant="destructive">إلغاء ترقية</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getMembershipBadge = (membership: string) => {
    switch (membership) {
      case "premium":
        return <Badge variant="default">مميز</Badge>;
      case "free":
        return <Badge variant="outline">عادي</Badge>;
      default:
        return <Badge variant="secondary">{membership}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          سجل الترقيات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الإجراءات</SelectItem>
              <SelectItem value="upgrade">ترقية</SelectItem>
              <SelectItem value="downgrade">إلغاء ترقية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>المدير</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>تنتهي في</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      لا توجد سجلات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.user_profile?.display_name || "مستخدم محذوف"}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        {getMembershipBadge(log.from_membership)}
                      </TableCell>
                      <TableCell>
                        {getMembershipBadge(log.to_membership)}
                      </TableCell>
                      <TableCell>
                        {log.admin_profile?.display_name || "نظام"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.upgraded_at), "yyyy/MM/dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        {log.expires_at ? format(new Date(log.expires_at), "yyyy/MM/dd") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
