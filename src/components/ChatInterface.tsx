import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, Trash2, Heart, Smile, Star, Cat, Coffee } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { ai, CHAT_MODEL, Message } from "@/src/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FloatingParticle = ({ delay = 0, color = "bg-cute-pink" }) => (
  <motion.div
    initial={{ y: "100vh", opacity: 0, x: Math.random() * 100 - 50 }}
    animate={{ 
      y: "-10vh", 
      opacity: [0, 1, 1, 0],
      x: (Math.random() * 100 - 50) + (Math.random() * 20 - 10)
    }}
    transition={{ 
      duration: 10 + Math.random() * 10, 
      repeat: Infinity, 
      delay,
      ease: "linear" 
    }}
    className={cn("absolute w-2 h-2 rounded-full blur-[1px] z-0", color)}
  />
);

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<"happy" | "sleepy" | "energetic">("happy");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Randomly change mood for cuteness
    const moods: ("happy" | "sleepy" | "energetic")[] = ["happy", "sleepy", "energetic"];
    setMood(moods[Math.floor(Math.random() * moods.length)]);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const chat = ai.chats.create({
        model: CHAT_MODEL,
        history: history,
        config: {
          systemInstruction: "당신은 세상에서 가장 귀엽고 친절한 AI 친구입니다. 이모지를 많이 사용하고, 사용자에게 다정하게 대하세요. 한국어로 답변하세요.",
        }
      });

      const result = await chat.sendMessage({
        message: input,
      });

      const modelResponse: Message = {
        role: "model",
        content: result.text || "우와! 대답을 생각하다가 깜빡했어요. 다시 물어봐 줄래요? ✨",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelResponse]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        role: "model",
        content: "어머나! 반짝이는 연결에 문제가 생겼어요. 잠시 후에 다시 만나요! 🌈",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setMood("happy");
    }
  };

  const getMoodIcon = () => {
    switch(mood) {
      case "sleepy": return <Coffee className="text-amber-400" size={14} />;
      case "energetic": return <Star className="text-yellow-400 animate-spin-slow" size={14} />;
      default: return <Smile className="text-green-400" size={14} />;
    }
  };

  const getMoodText = () => {
    switch(mood) {
      case "sleepy": return "졸려요..";
      case "energetic": return "신나요!";
      default: return "행복함";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fff9fb] p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cute-pink/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cute-blue/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating Particles */}
      <FloatingParticle delay={0} color="bg-cute-pink/30" />
      <FloatingParticle delay={2} color="bg-cute-blue/30" />
      <FloatingParticle delay={5} color="bg-cute-purple/30" />
      <FloatingParticle delay={7} color="bg-cute-yellow/30" />

      <Card className="w-full max-w-2xl h-[92vh] flex flex-col shadow-[0_30px_100px_rgba(255,133,161,0.2)] border-[6px] border-white rounded-[50px] overflow-hidden bg-white/60 backdrop-blur-xl z-10 relative">
        <CardHeader className="flex flex-row items-center justify-between border-b-4 border-slate-50 bg-white/40 px-10 py-8">
          <div className="flex items-center gap-5">
            <motion.div 
              animate={{ 
                rotate: mood === "energetic" ? [0, 10, -10, 0] : 0,
                scale: mood === "energetic" ? [1, 1.1, 1] : 1
              }}
              transition={{ repeat: mood === "energetic" ? Infinity : 0, duration: 0.5 }}
              className="bg-gradient-to-br from-cute-pink via-cute-purple to-cute-blue p-4 rounded-[24px] text-white shadow-xl shadow-cute-pink/40 relative"
            >
              <Cat size={28} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm"
              >
                <Heart size={12} className="fill-cute-pink text-cute-pink" />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                포근한 미니 <Sparkles className="text-cute-yellow fill-cute-yellow" size={20} />
              </CardTitle>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-cute-pink/40 text-cute-pink bg-cute-pink/5 px-2 py-0.5 rounded-full">
                  Gemini AI
                </Badge>
                <div className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-full border border-slate-100">
                  {getMoodIcon()}
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getMoodText()}</span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMessages([])} 
            className="rounded-full h-12 w-12 text-slate-200 hover:text-cute-pink hover:bg-cute-pink/10 transition-all active:scale-90"
          >
            <Trash2 size={22} />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <ScrollArea className="h-full px-10 py-12">
            <div className="space-y-12">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[55vh] text-center space-y-8">
                  <motion.div 
                    initial={{ y: 30, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative"
                  >
                    <div className="bg-white p-10 rounded-[50px] shadow-2xl border-8 border-cute-pink/5 relative z-10">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Smile size={80} className="text-cute-pink mb-6 mx-auto drop-shadow-lg" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-slate-800 mb-3">안녕! 기다렸어요! ✨</h3>
                      <p className="text-slate-400 max-w-[280px] mx-auto text-base font-semibold leading-relaxed">
                        오늘 당신의 하루는 어떤 색이었나요? <br/>
                        <span className="text-cute-pink">반짝이는 이야기</span>를 들려주세요!
                      </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-cute-yellow/30 rounded-full blur-2xl -z-10 animate-pulse" />
                    <div className="absolute -top-8 -left-8 w-28 h-28 bg-cute-blue/30 rounded-full blur-2xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
                  </motion.div>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.timestamp + index}
                    initial={{ opacity: 0, y: 30, scale: 0.8, rotate: message.role === "user" ? 2 : -2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    className={cn(
                      "flex gap-5 w-full",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      "h-12 w-12 border-[4px] shadow-lg shrink-0",
                      message.role === "user" ? "border-cute-blue/30" : "border-cute-pink/30"
                    )}>
                      {message.role === "user" ? (
                        <div className="bg-cute-blue flex items-center justify-center w-full h-full text-white">
                          <User size={24} />
                        </div>
                      ) : (
                        <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                          <Sparkles size={24} />
                        </div>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] space-y-2.5",
                      message.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-8 py-5 rounded-[35px] text-[16px] font-semibold shadow-xl leading-relaxed transition-all hover:scale-[1.02]",
                        message.role === "user" 
                          ? "bg-gradient-to-br from-cute-blue to-[#5bc0de] text-white rounded-tr-none shadow-cute-blue/20" 
                          : "bg-white text-slate-700 border-4 border-cute-pink/5 rounded-tl-none shadow-cute-pink/5"
                      )}>
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-cute-pink prose-strong:text-cute-purple">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.role === "model" && <Heart size={10} className="text-cute-pink/40 fill-cute-pink/40" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-5"
                >
                  <Avatar className="h-12 w-12 border-[4px] border-cute-pink/30 shadow-lg">
                    <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                      <Sparkles size={24} />
                    </div>
                  </Avatar>
                  <div className="bg-white border-4 border-cute-pink/5 px-8 py-5 rounded-[35px] rounded-tl-none shadow-xl flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span 
                          key={i}
                          animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            i === 0 ? "bg-cute-pink" : i === 1 ? "bg-cute-purple" : "bg-cute-blue"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-400 font-black tracking-widest uppercase">생각 중...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-10 bg-white/60 backdrop-blur-md border-t-4 border-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center gap-5"
          >
            <div className="relative flex-1 group">
              <Input
                placeholder="여기에 반짝이는 메시지를 적어주세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="pr-20 py-10 rounded-[40px] border-4 border-slate-100 focus:border-cute-pink/40 focus:ring-0 transition-all bg-white/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] text-slate-700 font-bold text-lg placeholder:text-slate-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isLoading}
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-cute-pink via-cute-purple to-cute-blue hover:scale-110 active:scale-90 shadow-2xl shadow-cute-pink/40 transition-all border-none group-focus-within:rotate-12"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </Button>
              </div>
            </div>
          </form>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-8 text-[12px] text-slate-300 font-black uppercase tracking-[0.4em] pointer-events-none opacity-40">
        Created with Magic & Gemini AI
      </div>
    </div>
  );
}
