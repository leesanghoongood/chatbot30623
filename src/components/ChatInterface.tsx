import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, Trash2, Heart, Smile, Star, Cat, Coffee, Image as ImageIcon, X, Music, Gift, Moon, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { ai, CHAT_MODEL, Message } from "@/src/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FloatingEmoji = ({ emoji, delay = 0 }) => (
  <motion.div
    initial={{ y: "110vh", opacity: 0, x: Math.random() * 100 + "%" }}
    animate={{ 
      y: "-10vh", 
      opacity: [0, 0.4, 0.4, 0],
      rotate: [0, 45, -45, 0]
    }}
    transition={{ 
      duration: 15 + Math.random() * 10, 
      repeat: Infinity, 
      delay,
      ease: "linear" 
    }}
    className="absolute text-2xl pointer-events-none z-0 select-none"
  >
    {emoji}
  </motion.div>
);

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
  const [mood, setMood] = useState<"happy" | "sleepy" | "energetic" | "thinking">("happy");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [petCount, setPetCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingText]);

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff85a1', '#7bdff2', '#b79ced', '#fcf6bd', '#d0f4de']
    });
  };

  const playSound = (type: 'send' | 'receive' | 'pop') => {
    if (isMuted) return;
    const sounds = {
      send: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      receive: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      pop: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.15;
    audio.play().catch(() => {});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        playSound('pop');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
      image: selectedImage || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    setMood("thinking");
    playSound('send');

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const chat = ai.chats.create({
        model: CHAT_MODEL,
        history: history,
        config: {
          systemInstruction: "당신은 세상에서 가장 귀엽고 완벽한 AI 친구 '포근이'입니다. 이모지를 아주 많이 사용하고(문장마다 3-4개), 사용자에게 애교 섞인 말투로 다정하게 대하세요. 한국어로 답변하세요. 사용자가 사진을 보내면 아주 기뻐하며 칭찬해주세요! ✨🌈💖🍭",
        }
      });

      let promptParts: any[] = [{ text: input || "이 사진에 대해 알려줘! ✨" }];
      if (userMessage.image) {
        promptParts.push({
          inlineData: {
            data: userMessage.image.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }

      const result = await chat.sendMessageStream({
        message: promptParts,
      });

      let fullText = "";
      setStreamingText("");

      for await (const chunk of result) {
        const text = chunk.text;
        fullText += text;
        setStreamingText(fullText);
      }

      const modelResponse: Message = {
        role: "model",
        content: fullText || "우와! 대답을 생각하다가 깜빡했어요. 다시 물어봐 줄래요? ✨",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelResponse]);
      setStreamingText("");
      setMood("happy");
      playSound('receive');
      
      if (messages.length % 2 === 0) {
        fireConfetti();
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        role: "model",
        content: "어머나! 반짝이는 연결에 문제가 생겼어요. 잠시 후에 다시 만나요! 🌈",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setMood("sleepy");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePet = () => {
    setPetCount(prev => prev + 1);
    setMood("energetic");
    playSound('pop');
    setTimeout(() => setMood("happy"), 1500);
    
    if ((petCount + 1) % 5 === 0) {
      fireConfetti();
    }
  };

  const getMoodIcon = () => {
    switch(mood) {
      case "sleepy": return <Coffee className="text-amber-400" size={14} />;
      case "thinking": return <Loader2 className="text-cute-blue animate-spin" size={14} />;
      case "energetic": return <Star className="text-yellow-400 animate-spin-slow" size={14} />;
      default: return <Smile className="text-green-400" size={14} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fff9fb] p-4 relative overflow-hidden font-sans custom-scrollbar">
      {/* Magical Background */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-cute-pink/15 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-cute-blue/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating Elements */}
      {[...Array(8)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 2} color={["bg-cute-pink", "bg-cute-blue", "bg-cute-purple", "bg-cute-yellow"][i % 4] + "/30"} />
      ))}
      <FloatingEmoji emoji="💖" delay={1} />
      <FloatingEmoji emoji="✨" delay={4} />
      <FloatingEmoji emoji="☁️" delay={8} />
      <FloatingEmoji emoji="🌈" delay={12} />
      <FloatingEmoji emoji="🍭" delay={15} />

      <Card className="w-full max-w-3xl h-[94vh] flex flex-col shadow-[0_40px_120px_rgba(255,133,161,0.25)] border-[8px] border-white rounded-[60px] overflow-hidden bg-white/40 backdrop-blur-2xl z-10 relative">
        <CardHeader className="flex flex-row items-center justify-between border-b-4 border-slate-50/50 bg-white/30 px-12 py-10">
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: -15 }}
              animate={{ 
                rotate: mood === "energetic" ? [0, 15, -15, 0] : 0,
                y: mood === "energetic" ? [0, -10, 0] : 0
              }}
              transition={{ repeat: mood === "energetic" ? Infinity : 0, duration: 0.4 }}
              className="bg-gradient-to-br from-cute-pink via-cute-purple to-cute-blue p-5 rounded-[30px] text-white shadow-2xl shadow-cute-pink/40 relative cursor-pointer group"
              onClick={handlePet}
            >
              <Cat size={32} />
              <motion.div 
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md"
              >
                <Heart size={14} className="fill-cute-pink text-cute-pink" />
              </motion.div>
              <div className="absolute -bottom-2 -right-2 bg-white text-[10px] font-black text-cute-pink px-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                +{petCount}
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3 font-cute">
                포근이 <Sparkles className="text-cute-yellow fill-cute-yellow animate-pulse" size={24} />
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="text-[11px] font-black uppercase tracking-[0.3em] border-cute-pink/50 text-cute-pink bg-white/80 px-3 py-1 rounded-full shadow-sm">
                  Ultimate Cute AI
                </Badge>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  {getMoodIcon()}
                  <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
                    {mood === "thinking" ? "고민 중..." : mood === "sleepy" ? "졸려요.." : mood === "energetic" ? "신나요!" : "행복함"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { fireConfetti(); playSound('pop'); }} 
              className="rounded-full h-12 w-12 text-cute-yellow hover:bg-cute-yellow/10 transition-all active:scale-90"
            >
              <Gift size={22} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMuted(!isMuted)} 
              className="rounded-full h-12 w-12 text-slate-300 hover:text-cute-blue hover:bg-cute-blue/10 transition-all"
            >
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMessages([])} 
              className="rounded-full h-12 w-12 text-slate-200 hover:text-cute-pink hover:bg-cute-pink/10 transition-all active:scale-90"
            >
              <Trash2 size={22} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <ScrollArea className="h-full px-12 py-14 custom-scrollbar">
            <div className="space-y-14">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-10">
                  <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 100 }}
                    className="relative"
                  >
                    <div className="bg-white/90 p-12 rounded-[60px] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border-[10px] border-cute-pink/5 relative z-10 backdrop-blur-sm overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cute-pink via-cute-purple to-cute-blue" />
                      <motion.div
                        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      >
                        <Smile size={100} className="text-cute-pink mb-8 mx-auto drop-shadow-2xl" />
                      </motion.div>
                      <h3 className="text-3xl font-black text-slate-800 mb-4 font-cute">안녕! 포근이가 왔어요! ✨</h3>
                      <p className="text-slate-400 max-w-[320px] mx-auto text-lg font-bold leading-relaxed">
                        오늘 당신의 세상은 어떤가요? <br/>
                        사진을 보여주거나 <span className="text-cute-pink underline decoration-cute-pink/30 underline-offset-4">비밀 이야기</span>를 들려주세요! 💖
                      </p>
                      <div className="mt-8 flex justify-center gap-3">
                        <Badge className="bg-cute-mint text-slate-600 border-none hover:scale-110 transition-transform cursor-default">#행복</Badge>
                        <Badge className="bg-cute-blue/20 text-cute-blue border-none hover:scale-110 transition-transform cursor-default">#응원</Badge>
                        <Badge className="bg-cute-purple/20 text-cute-purple border-none hover:scale-110 transition-transform cursor-default">#친구</Badge>
                      </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cute-yellow/40 rounded-full blur-3xl -z-10 animate-pulse" />
                    <div className="absolute -top-10 -left-10 w-36 h-36 bg-cute-blue/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1.5s' }} />
                  </motion.div>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.timestamp + index}
                    initial={{ opacity: 0, y: 40, scale: 0.7, rotate: message.role === "user" ? 5 : -5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    className={cn(
                      "flex gap-6 w-full",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      "h-14 w-14 border-[5px] shadow-xl shrink-0 transition-transform hover:scale-110",
                      message.role === "user" ? "border-cute-blue/40" : "border-cute-pink/40"
                    )}>
                      {message.role === "user" ? (
                        <div className="bg-cute-blue flex items-center justify-center w-full h-full text-white">
                          <User size={28} />
                        </div>
                      ) : (
                        <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                          <Sparkles size={28} />
                        </div>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] space-y-3",
                      message.role === "user" ? "items-end" : "items-start"
                    )}>
                      {message.image && (
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="rounded-[30px] overflow-hidden border-4 border-white shadow-lg mb-2 max-w-[300px]"
                        >
                          <img src={message.image} alt="Uploaded" className="w-full h-auto" referrerPolicy="no-referrer" />
                        </motion.div>
                      )}
                      <div className={cn(
                        "px-10 py-6 rounded-[40px] text-[17px] font-bold shadow-2xl leading-relaxed transition-all hover:shadow-cute-pink/10",
                        message.role === "user" 
                          ? "bg-gradient-to-br from-cute-blue to-[#48cae4] text-white rounded-tr-none shadow-cute-blue/30" 
                          : "bg-white text-slate-700 border-4 border-cute-pink/10 rounded-tl-none shadow-cute-pink/10"
                      )}>
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-cute-pink prose-strong:text-cute-purple prose-code:bg-slate-50 prose-code:p-1 prose-code:rounded">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4">
                        <span className="text-[11px] text-slate-300 font-black uppercase tracking-[0.3em]">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.role === "model" && (
                          <motion.div
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Heart size={12} className="text-cute-pink/50 fill-cute-pink/50" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-6 w-full"
                  >
                    <Avatar className="h-14 w-14 border-[5px] border-cute-pink/40 shadow-xl shrink-0">
                      <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                        <Sparkles size={28} />
                      </div>
                    </Avatar>
                    <div className="flex flex-col max-w-[85%] space-y-3 items-start">
                      <div className="px-10 py-6 rounded-[40px] rounded-tl-none text-[17px] font-bold shadow-2xl leading-relaxed bg-white text-slate-700 border-4 border-cute-pink/10">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamingText}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isLoading && !streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-6"
                >
                  <Avatar className="h-14 w-14 border-[5px] border-cute-pink/40 shadow-xl">
                    <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                      <Sparkles size={28} />
                    </div>
                  </Avatar>
                  <div className="bg-white border-4 border-cute-pink/10 px-10 py-6 rounded-[40px] rounded-tl-none shadow-2xl flex items-center gap-5">
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.span 
                          key={i}
                          animate={{ y: [0, -12, 0], scale: [1, 1.4, 1] }} 
                          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                          className={cn(
                            "w-3.5 h-3.5 rounded-full shadow-md",
                            i === 0 ? "bg-cute-pink" : i === 1 ? "bg-cute-purple" : "bg-cute-blue"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-base text-slate-400 font-black tracking-[0.2em] uppercase font-cute">마법을 부리는 중...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-12 bg-white/40 backdrop-blur-xl border-t-4 border-slate-50/50 flex flex-col gap-6">
          {selectedImage && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative self-start"
            >
              <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-[20px] border-4 border-white shadow-xl" referrerPolicy="no-referrer" />
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg"
                onClick={() => setSelectedImage(null)}
              >
                <X size={14} />
              </Button>
            </motion.div>
          )}
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center gap-6"
          >
            <div className="relative flex-1 group">
              <Input
                placeholder="여기에 마법 같은 메시지를..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="pr-32 py-12 rounded-[50px] border-[5px] border-slate-100 focus:border-cute-pink/50 focus:ring-0 transition-all bg-white/90 shadow-[inset_0_4px_15px_rgba(0,0,0,0.03)] text-slate-700 font-black text-xl placeholder:text-slate-200"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload}
                />
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 rounded-full text-slate-300 hover:text-cute-blue hover:bg-cute-blue/10 transition-all"
                >
                  <ImageIcon size={24} />
                </Button>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-cute-pink via-cute-purple to-cute-blue hover:scale-110 active:scale-90 shadow-[0_10px_30px_rgba(255,133,161,0.4)] transition-all border-none group-focus-within:rotate-6"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={28} /> : <Send size={28} />}
                </Button>
              </div>
            </div>
          </form>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-10 text-[13px] text-slate-300 font-black uppercase tracking-[0.6em] pointer-events-none opacity-40 font-cute flex items-center gap-4">
        <Music size={14} className="animate-bounce" />
        Magic Powered by Gemini AI
        <Moon size={14} className="animate-pulse" />
      </div>
    </div>
  );
}
