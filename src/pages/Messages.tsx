import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Send, MessageCircle, Search, MoreVertical, Check, CheckCheck, Users, Clock, AlertCircle, Phone, Star, ArrowRight } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Handle URL parameters for direct chat
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sellerId = params.get('seller');
    const adId = params.get('ad');
    
    if (sellerId && user && sellerId !== user.id) {
      // Fetch seller info and start chat
      fetchSellerInfo(sellerId, adId);
    }
  }, [location.search, user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSellerInfo = async (sellerId: string, adId?: string) => {
    try {
      const { data: sellerProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (error) throw error;

      const chatData = {
        userId: sellerId,
        userName: sellerProfile?.display_name || "مستخدم",
        lastMessage: "",
        lastMessageTime: new Date().toISOString(),
        isRead: true,
        adId: adId || null,
        unreadCount: 0
      };

      setSelectedChat(chatData);
    } catch (error) {
      console.error('Error fetching seller info:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Messages subscription
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          console.log('Message change received:', payload);
          fetchConversations();
          if (selectedChat) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Get unique conversations with unread counts
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(display_name, user_id),
          receiver_profile:profiles!messages_receiver_id_fkey(display_name, user_id)
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
            adId: message.ad_id,
            unreadCount: 0
          });
        }
      });

      // Calculate unread counts for each conversation
      for (const [userId, conversation] of conversationMap) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', userId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        
        conversation.unreadCount = count || 0;
      }

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

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user || !selectedChat) return;
    
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", selectedChat.userId);

      // Update conversations list
      fetchConversations();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      toast({
        title: "تم بنجاح",
        description: "تم تحديد جميع الرسائل كمقروءة"
      });

      fetchConversations();
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرسائل",
        variant: "destructive"
      });
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
      await fetchMessages();
      await fetchConversations();
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

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  const formatMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now.getTime() - messageTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `${diffInMinutes} د`;
    if (diffInHours < 24) return `${diffInHours} س`;
    if (diffInDays < 7) return `${diffInDays} ي`;
    
    return messageTime.toLocaleDateString("ar-SA", { 
      month: "short", 
      day: "numeric" 
    });
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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 card-gradient border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>المحادثات</span>
                    {getTotalUnreadCount() > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {getTotalUnreadCount()}
                      </Badge>
                    )}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={markAllAsRead}>
                        <CheckCheck className="h-4 w-4 ml-2" />
                        تحديد الكل كمقروء
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في المحادثات..."
                    className="pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[520px] overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-6 text-center">
                      {conversations.length === 0 ? (
                        <div className="space-y-2">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <p className="text-muted-foreground text-sm">لا توجد محادثات بعد</p>
                          <p className="text-xs text-muted-foreground">ابدأ محادثة من صفحة الإعلانات</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Search className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.userId}
                        onClick={() => setSelectedChat(conversation)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 border-b border-border last:border-b-0 ${
                          selectedChat?.userId === conversation.userId 
                            ? "bg-primary/5 border-r-4 border-r-primary" 
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={`${conversation.unreadCount > 0 ? 'ring-2 ring-primary/20' : ''}`}>
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {conversation.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {onlineUsers.has(conversation.userId) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {conversation.userName}
                              </h4>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.lastMessageTime)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs rounded-full">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className={`text-sm truncate flex-1 ${conversation.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                {conversation.lastMessage || "لا توجد رسائل"}
                              </p>
                              {conversation.isRead && selectedChat?.userId === conversation.userId && (
                                <CheckCheck className="h-3 w-3 text-primary shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              {selectedChat ? (
                <Card className="card-gradient border-0 shadow-lg h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="ring-2 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                              {selectedChat.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {onlineUsers.has(selectedChat.userId) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{selectedChat.userName}</h3>
                          <div className="flex items-center gap-2">
                            {onlineUsers.has(selectedChat.userId) ? (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600">متصل الآن</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">آخر ظهور قريباً</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={markMessagesAsRead}>
                              <Check className="h-4 w-4 ml-2" />
                              تحديد كمقروء
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100% - 80px)' }}>
                        {messages.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="space-y-3">
                              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <MessageCircle className="h-8 w-8 text-primary" />
                              </div>
                              <h4 className="font-medium text-lg">ابدأ محادثة جديدة</h4>
                              <p className="text-muted-foreground">
                                مرحباً بك في محادثة مع {selectedChat.userName}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {messages.map((message, index) => {
                              const isOwn = message.sender_id === user.id;
                              const showTime = index === 0 || 
                                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes
                              
                              return (
                                <div key={message.id}>
                                  {showTime && (
                                    <div className="text-center my-4">
                                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {new Date(message.created_at).toLocaleDateString("ar-SA", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] group`}>
                                      <div
                                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                                          isOwn
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted rounded-bl-md"
                                        }`}
                                      >
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                      </div>
                                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(message.created_at).toLocaleTimeString("ar-SA", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })}
                                        </span>
                                        {isOwn && (
                                          <div className="flex">
                                            {message.is_read ? (
                                              <CheckCheck className="h-3 w-3 text-primary" />
                                            ) : (
                                              <Check className="h-3 w-3 text-muted-foreground" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-border p-4 bg-gradient-to-r from-background to-muted/20">
                        <form onSubmit={sendMessage} className="flex gap-3">
                          <div className="flex-1 relative">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="اكتب رسالة..."
                              className="pr-4 pl-12 py-3 rounded-xl border-2 focus:border-primary/50 transition-colors"
                              maxLength={500}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {newMessage.length}/500
                            </div>
                          </div>
                          <Button 
                            type="submit" 
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-3 rounded-xl hover:scale-105 transition-transform"
                          >
                            {sending ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-gradient border-0 shadow-lg h-full">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <MessageCircle className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">اختر محادثة</h3>
                      <p className="text-muted-foreground text-lg">
                        اختر محادثة من القائمة لبدء المراسلة
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span>أو ابدأ محادثة جديدة من صفحة الإعلانات</span>
                      </div>
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