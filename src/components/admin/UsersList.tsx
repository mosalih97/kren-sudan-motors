
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Phone, MapPin, Star, Coins } from "lucide-react";

export const UsersList = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsersList"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_users_list");
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          قائمة المستخدمين ({users?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user: any) => (
            <div
              key={user.user_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4 space-x-reverse">
                <Avatar>
                  <AvatarFallback>
                    {user.display_name?.charAt(0) || "؟"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {user.display_name || "مجهول"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.city}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {user.points} نقطة
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={user.membership_type === "premium" ? "default" : "secondary"}
                >
                  {user.membership_type === "premium" ? (
                    <Star className="h-3 w-3 ml-1" />
                  ) : null}
                  {user.membership_type === "premium" ? "مميز" : "عادي"}
                </Badge>
                <Badge variant="outline">{user.ads_count} إعلان</Badge>
              </div>
            </div>
          ))}

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات مستخدمين
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
