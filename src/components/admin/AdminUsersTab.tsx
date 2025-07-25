
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Filter, TrendingUp, TrendingDown, Clock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  membership_type: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  credits: number;
  created_at: string;
  role: string;
}

interface AdminUsersTabProps {
  onStatsUpdate: () => void;
}

export const AdminUsersTab = ({ onStatsUpdate }: AdminUsersTabProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل في جلب المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId: string) => {
    setUpgrading(userId);
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: user?.id
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم ترقية المستخدم بنجاح");
        fetchUsers();
        onStatsUpdate();
      } else {
        toast.error(data?.message || "فشل في ترقية المستخدم");
      }
    } catch (error) {
      console.error("Error upgrading user:", error);
      toast.error("حدث خطأ أثناء ترقية المستخدم");
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngrade = async (userId: string) => {
    setUpgrading(userId);
    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: user?.id
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم إلغاء ترقية المستخدم بنجاح");
        fetchUsers();
        onStatsUpdate();
      } else {
        toast.error(data?.message || "فشل في إلغاء ترقية المستخدم");
      }
    } catch (error) {
      console.error("Error downgrading user:", error);
      toast.error("حدث خطأ أثناء إلغاء ترقية المستخدم");
    } finally {
      setUpgrading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMembership = membershipFilter === "all" || user.membership_type === membershipFilter;
    return matchesSearch && matchesMembership;
  });

  const getMembershipBadge = (user: User) => {
    if (user.membership_type === "premium") {
      return <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        مميز
      </Badge>;
    }
    return <Badge variant="outline">عادي</Badge>;
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    
    if (diffTime <= 0) return "انتهت";
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} يوم`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          إدارة المستخدمين
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
          
          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع العضوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              <SelectItem value="premium">المستخدمين المميزين</SelectItem>
              <SelectItem value="free">المستخدمين العاديين</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>نوع العضوية</TableHead>
                  <TableHead>النقاط</TableHead>
                  <TableHead>الوقت المتبقي</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      لا يوجد مستخدمون
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {user.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.display_name}</div>
                          {user.role === "admin" && (
                            <Badge variant="destructive" className="text-xs">
                              مدير
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMembershipBadge(user)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{user.credits}</span>
                      </TableCell>
                      <TableCell>
                        {user.membership_type === "premium" ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {getTimeRemaining(user.premium_expires_at)}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "yyyy/MM/dd")}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.role !== "admin" && (
                          <div className="flex gap-2 justify-center">
                            {user.membership_type === "free" ? (
                              <Button
                                size="sm"
                                onClick={() => handleUpgrade(user.user_id)}
                                disabled={upgrading === user.user_id}
                              >
                                {upgrading === user.user_id ? "جاري..." : (
                                  <>
                                    <TrendingUp className="h-3 w-3 ml-1" />
                                    ترقية
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDowngrade(user.user_id)}
                                disabled={upgrading === user.user_id}
                              >
                                {upgrading === user.user_id ? "جاري..." : (
                                  <>
                                    <TrendingDown className="h-3 w-3 ml-1" />
                                    إلغاء ترقية
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
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
