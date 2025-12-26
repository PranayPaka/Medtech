
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Loader2, Pill, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { chatbotApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async (overrideMessage?: string) => {
        const msgToSend = overrideMessage !== undefined ? overrideMessage : message;
        if (!msgToSend.trim() || isLoading) return;

        setMessage("");
        setChatHistory(prev => [...prev, { role: 'user', content: msgToSend }]);
        setIsLoading(true);

        try {
            const response = await chatbotApi.query(msgToSend);
            setChatHistory(prev => [...prev, { role: 'assistant', content: response.response }]);
        } catch (error) {
            console.error("Chatbot query failed:", error);
            toast({
                title: "Chatbot Error",
                description: "Failed to get a response. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <Card className="w-[350px] md:w-[420px] h-[600px] flex flex-col glass shadow-premium-lg border-white/20 dark:border-white/10 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-primary p-5 flex flex-row items-center justify-between space-y-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-80" />
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-white relative z-10 font-heading">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 rotate-3">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="leading-none">Medicine Assistant</span>
                                <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest mt-1">AI Clinical Support</span>
                            </div>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white hover:bg-white/20 rounded-xl transition-all relative z-10"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-muted/50 to-background/50 scrollbar-hide" ref={scrollRef}>
                        {chatHistory.length === 0 && (
                            <div className="text-center py-12 px-6 h-full flex flex-col items-center justify-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                    <div className="relative p-5 bg-primary/10 rounded-3xl border border-primary/20 shadow-glow">
                                        <Pill className="h-10 w-10 text-primary animate-float" />
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-foreground mb-2">How can I assist you?</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    I can provide insights on dosage, symptoms, and drug interactions based on our clinical databases.
                                </p>
                                <div className="mt-8 grid grid-cols-1 gap-2 w-full">
                                    <Badge
                                        variant="outline"
                                        className="justify-center py-2 bg-white/50 border-dashed cursor-pointer hover:bg-primary/5 transition-colors"
                                        onClick={() => handleSend("Check drug interactions")}
                                    >
                                        "Check drug interactions"
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="justify-center py-2 bg-white/50 border-dashed cursor-pointer hover:bg-primary/5 transition-colors"
                                        onClick={() => handleSend("Analyze common flu symptoms")}
                                    >
                                        "Analyze common flu symptoms"
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground/50 mt-10 uppercase tracking-tighter font-bold">
                                    Institutional AI Support &bull; Restricted Access
                                </p>
                            </div>
                        )}

                        {chatHistory.map((chat, i) => (
                            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] flex gap-3 ${chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold border shadow-sm ${chat.role === 'user' ? 'bg-primary text-white border-primary/20' : 'bg-white text-muted-foreground'
                                        }`}>
                                        {chat.role === 'user' ? 'YOU' : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${chat.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-white dark:bg-black/40 border rounded-tl-none backdrop-blur-sm'
                                        }`}>
                                        {chat.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-primary animate-spin" />
                                    </div>
                                    <div className="bg-white/50 dark:bg-black/20 border rounded-2xl rounded-tl-none p-4 backdrop-blur-sm">
                                        <div className="flex gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-4 border-t bg-white/80 dark:bg-black/60 backdrop-blur-xl">
                        <div className="relative w-full group">
                            <Input
                                placeholder="Consult clinical assistant..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="w-full h-14 bg-muted/40 border-border/50 focus:border-primary focus:ring-primary/10 transition-all rounded-2xl pl-5 pr-14 text-sm font-medium"
                            />
                            <Button
                                size="icon"
                                onClick={() => handleSend()}
                                disabled={isLoading || !message.trim()}
                                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary-hover shadow-glow transition-all active:scale-90 disabled:opacity-30"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    size="lg"
                    className="h-16 w-16 rounded-full shadow-premium-lg bg-primary hover:bg-primary-hover border-4 border-background transition-all hover:scale-110 active:scale-95 group relative flex items-center justify-center p-0 overflow-hidden"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <MessageSquare className="h-7 w-7 text-white relative z-10" />
                </Button>
            )}
        </div>
    );
};

export default AIChatbot;
