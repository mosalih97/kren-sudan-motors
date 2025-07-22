import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Send, MessageCircle, Search, MoreVertical } from "lucide-react";
import { filterMessage } from "@/utils/messageFilter";

const Messages = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Get unique conversations
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(display_name),
          receiver_profile:profiles!messages_receiver_id_fkey(display_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map();
      
      data?.forEach((message) => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUserName = message.sender_id === user.id 
          ? message.receiver_profile?.display_name 
          : message.sender_profile?.display_name;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName || "مستخدم",
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            isRead: message.receiver_id === user.id ? message.is_read : true,
            adId: message.ad_id
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedChat) return;
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(display_name),
          receiver_profile:profiles!messages_receiver_id_fkey(display_name)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.userId}),and(sender_id.eq.${selectedChat.userId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", selectedChat.userId);

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || !newMessage.trim()) return;

    // فلترة الرسالة للتأكد من عدم وجود أرقام
    const messageFilter = filterMessage(newMessage.trim());
    if (!messageFilter.isValid) {
      toast({
        title: "رسالة غير مسموحة",
        description: messageFilter.errorMessage,
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat.userId,
          content: newMessage.trim(),
          ad_id: selectedChat.adId
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
      fetchConversations();
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="card-gradient border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  المحادثات ({conversations.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في المحادثات..."
                    className="pr-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      لا توجد محادثات بعد
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.userId}
                        onClick={() => setSelectedChat(conversation)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border ${
                          selectedChat?.userId === conversation.userId ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {conversation.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate">
                                {conversation.userName}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.lastMessageTime).toLocaleDateString("ar-SA")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          
                          {!conversation.isRead && (
                            <Badge variant="default" className="w-2 h-2 p-0 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <Card className="card-gradient border-0 shadow-lg h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {selectedChat.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{selectedChat.userName}</h3>
                          <p className="text-sm text-muted-foreground">متصل الآن</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            ابدأ محادثة جديدة
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender_id === user.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  message.sender_id === user.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(message.created_at).toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-border p-4">
                        <form onSubmit={sendMessage} className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="اكتب رسالة..."
                            className="flex-1"
                          />
                          <Button type="submit" disabled={sending || !newMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-gradient border-0 shadow-lg h-full">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">اختر محادثة</h3>
                      <p className="text-muted-foreground">
                        اختر محادثة من القائمة لبدء المراسلة
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;