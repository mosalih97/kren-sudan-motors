
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
  receiver?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: Message;
  messages: Message[];
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(display_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "خطأ في جلب الرسائل",
        description: "حدث خطأ أثناء جلب الرسائل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedConversation,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
      
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    }
  };

  // تجميع الرسائل حسب المحادثة
  const conversations = messages.reduce((acc, message) => {
    const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        userId: otherUserId,
        userName: message.sender_id === user?.id ? message.receiver?.display_name || 'مستخدم' : message.sender?.display_name || 'مستخدم',
        lastMessage: message,
        messages: []
      };
    }
    acc[otherUserId].messages.push(message);
    return acc;
  }, {} as Record<string, Conversation>);

  const conversationList = Object.values(conversations);
  const currentConversation = selectedConversation ? conversations[selectedConversation] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">الرسائل</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* قائمة المحادثات */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>المحادثات</CardTitle>
                <CardDescription>
                  {conversationList.length} محادثة
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {conversationList.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      لا توجد رسائل بعد
                    </div>
                  ) : (
                    conversationList.map((conversation) => (
                      <button
                        key={conversation.userId}
                        onClick={() => setSelectedConversation(conversation.userId)}
                        className={`w-full p-4 text-right hover:bg-muted/50 transition-colors ${
                          selectedConversation === conversation.userId ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {conversation.userName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                                addSuffix: true,
                                locale: ar
                              })}
                            </div>
                            {!conversation.lastMessage.is_read && 
                             conversation.lastMessage.receiver_id === user?.id && (
                              <Badge variant="default" className="text-xs">
                                جديد
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* نافذة المحادثة */}
            <Card className="lg:col-span-2">
              {!selectedConversation ? (
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2">اختر محادثة</h3>
                  <p className="text-muted-foreground">
                    اختر محادثة من القائمة لبدء المراسلة
                  </p>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      {currentConversation?.userName}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0 flex flex-col h-[450px]">
                    {/* الرسائل */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {currentConversation?.messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div>{message.content}</div>
                            <div className={`text-xs mt-1 ${
                              message.sender_id === user?.id 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: ar
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* إرسال رسالة جديدة */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="اكتب رسالتك..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              sendMessage();
                            }
                          }}
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
