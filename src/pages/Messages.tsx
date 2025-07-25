
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { NavigationArrows } from "@/components/NavigationArrows";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Messages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(display_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.receiver?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton variant="floating" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                المحادثات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المحادثات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Messages List */}
              {loading ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground">جاري تحميل المحادثات...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">لا توجد محادثات</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "لم يتم العثور على محادثات مطابقة" : "لا توجد محادثات حتى الآن"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {message.sender_id === user?.id 
                                ? message.receiver?.display_name || "مستخدم"
                                : message.sender?.display_name || "مستخدم"
                              }
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NavigationArrows
        prevPage={{
          url: "/",
          title: "الرئيسية"
        }}
        nextPage={{
          url: "/notifications",
          title: "الإشعارات"
        }}
      />
    </div>
  );
};

export default Messages;
