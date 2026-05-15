import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, Trash2, Heart, Smile, Star, Cat, Coffee, Image as ImageIcon, X, Music, Gift, Moon, Volume2, VolumeX, Copy, Wand2, Crown, UtensilsCrossed, Gamepad2, Book } from "lucide-react";
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

const SparkleTrail = () => {
  const [trails, setTrails] = useState<{ id: number; x: number; y: number }[]>([]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.8) {
        const id = Date.now();
        setTrails(prev => [...prev, { id, x: e.clientX, y: e.clientY }].slice(-15));
        setTimeout(() => {
          setTrails(prev => prev.filter(t => t.id !== id));
        }, 1000);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {trails.map(trail => (
        <motion.div
          key={trail.id}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.8, 0], rotate: 180 }}
          style={{ left: trail.x, top: trail.y }}
          className="absolute text-cute-pink"
        >
          <Sparkles size={16} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("pogn_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<"happy" | "sleepy" | "energetic" | "thinking">("happy");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [petCount, setPetCount] = useState(0);
  const [friendshipScore, setFriendshipScore] = useState(Number(localStorage.getItem("pogn_score")) || 0);
  const [lastLeveledUp, setLastLeveledUp] = useState(Math.floor((Number(localStorage.getItem("pogn_score")) || 0) / 10) + 1);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [catDialogue, setCatDialogue] = useState("");
  const [theme, setTheme] = useState<"pink" | "blue" | "mint" | "purple">("pink");
  const [nickname, setNickname] = useState(localStorage.getItem("pogn_nickname") || "친구님");
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [missions, setMissions] = useState<{ title: string; completed: boolean; icon: string }[]>(() => {
    const saved = localStorage.getItem("pogn_missions");
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("pogn_last_mission_date");
    
    if (lastDate !== today) {
      return [
        { title: "포근이 5번 쓰다듬기", completed: false, icon: "🐾" },
        { title: "포근이에게 간식 주기", completed: false, icon: "🍖" },
        { title: "오늘의 일기 쓰기", completed: false, icon: "📔" }
      ];
    }
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("pogn_missions", JSON.stringify(missions));
    localStorage.setItem("pogn_last_mission_date", new Date().toDateString());
  }, [missions]);

  useEffect(() => {
    if (petCount >= 5) updateMission("포근이 5번 쓰다듬기");
  }, [petCount]);

  const updateMission = (title: string) => {
    setMissions(prev => prev.map(m => {
      if (m.title === title && !m.completed) {
        setShowNotification(`📢 미션 완료! [${m.title}] ✨`);
        setFriendshipScore(s => s + 5);
        fireConfetti();
        playSound('receive');
        return { ...m, completed: true };
      }
      return m;
    }));
  };

  const [diaries, setDiaries] = useState<{ id: string; date: string; content: string }[]>(() => {
    return JSON.parse(localStorage.getItem("pogn_diaries") || "[]");
  });
  const [gameScore, setGameScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("pogn_achievements") || "[]");
  });
  const [volume, setVolume] = useState(0.1);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem("pogn_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const now = new Date();
      const hour = now.getHours();
      let timeGreeting = "";
      
      if (hour >= 5 && hour < 12) timeGreeting = "좋은 아침이에용! ☀️";
      else if (hour >= 12 && hour < 17) timeGreeting = "나른한 오후네용~ ☕";
      else if (hour >= 17 && hour < 21) timeGreeting = "분위기 있는 저녁이에용! ✨";
      else timeGreeting = "포근하고 아늑한 밤이에용.. ⭐";

      const greetings = [
        `${timeGreeting} ${nickname}! 오늘 하루는 어떠신가용? ✨`,
        `${nickname}, 포근이가 많이 보고 싶었어용! 🐾`,
        `반가워용, ${nickname}! 우리 오늘 재미있게 대화해용! 🍭`,
        `우와! ${nickname}이다! 오늘 좋은 일이 생길 것 같아용! 🌈`
      ];
      setMessages([{
        role: "model",
        content: greetings[Math.floor(Math.random() * greetings.length)],
        timestamp: Date.now()
      }]);
    }
  }, [nickname]);
  
  const [suggestions] = useState([
    "오늘 기분 어때? ✨",
    "칭찬 한 마디 해줘! 💖",
    "재미있는 얘기해줘! 🍭",
    "포근아 사랑해! 🐾"
  ]);

  const friendshipLevels = [
    { level: 1, name: "어색한 사이", icon: "🌱" },
    { level: 2, name: "조금 아는 사이", icon: "🌿" },
    { level: 3, name: "친한 친구", icon: "🌸" },
    { level: 4, name: "베스트 프렌드", icon: "✨" },
    { level: 5, name: "세상의 단짝", icon: "💎" },
    { level: 6, name: "영원한 동반자", icon: "👑" },
    { level: 7, name: "운명의 소울메이트", icon: "🌙" },
    { level: 8, name: "우주 최고의 짝꿍", icon: "🌌" },
    { level: 9, name: "마법 같은 우정", icon: "🔮" },
    { level: 10, name: "전설의 유대", icon: "🌈" },
    { level: 11, name: "로열 파트너", icon: "💍" },
    { level: 12, name: "포근이의 전부", icon: "💖" }
  ];

  const currentLevelInfo = friendshipLevels[Math.min(Math.floor(friendshipScore / 10), friendshipLevels.length - 1)];
  const friendshipLevel = currentLevelInfo.level;
  const friendshipName = currentLevelInfo.name;
  const friendshipIcon = currentLevelInfo.icon;
  const friendshipProgress = Math.min((friendshipScore % 10) * 10, 100);
  
  const themes = {
    pink: {
      primary: "from-cute-pink via-cute-purple to-cute-blue",
      bg: "bg-[#fff9fb]",
      border: "border-cute-pink/40",
      text: "text-cute-pink",
      button: "bg-cute-pink",
      msgUser: "bg-gradient-to-br from-cute-pink to-[#ff6b8b]",
      particle: "bg-cute-pink"
    },
    blue: {
      primary: "from-cute-blue via-[#48cae4] to-[#00b4d8]",
      bg: "bg-[#f0f9ff]",
      border: "border-cute-blue/40",
      text: "text-cute-blue",
      button: "bg-cute-blue",
      msgUser: "bg-gradient-to-br from-cute-blue to-[#0077b6]",
      particle: "bg-cute-blue"
    },
    mint: {
      primary: "from-cute-mint via-[#a8e6cf] to-[#1fab89]",
      bg: "bg-[#f2fff9]",
      border: "border-cute-mint/40",
      text: "text-cute-mint",
      button: "bg-cute-mint",
      msgUser: "bg-gradient-to-br from-[#81e6d9] to-[#2c7a7b]",
      particle: "bg-cute-mint"
    },
    purple: {
      primary: "from-cute-purple via-[#d4a5f9] to-[#805ad5]",
      bg: "bg-[#faf5ff]",
      border: "border-cute-purple/40",
      text: "text-cute-purple",
      button: "bg-cute-purple",
      msgUser: "bg-gradient-to-br from-cute-purple to-[#553c9a]",
      particle: "bg-cute-purple"
    }
  };

  const currentTheme = themes[theme];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollBottom(!isAtBottom);
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

  useEffect(() => {
    bgmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'); // Need a loopable soft BGM, using a placeholder for now
    bgmRef.current.loop = true;
    bgmRef.current.volume = volume / 2;
    
    return () => {
      bgmRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume / 2;
    }
  }, [volume]);

  const toggleBgm = () => {
    if (isBgmPlaying) {
      bgmRef.current?.pause();
    } else {
      bgmRef.current?.play().catch(() => {});
    }
    setIsBgmPlaying(!isBgmPlaying);
  };

  const playSound = (type: 'send' | 'receive' | 'pop') => {
    if (isMuted) return;
    const sounds = {
      send: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      receive: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      pop: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = volume;
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
    setFriendshipScore(prev => prev + 1);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    setMood("thinking");
    playSound('send');

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const chat = ai.chats.create({
        model: CHAT_MODEL,
        config: {
          systemInstruction: `당신은 세상에서 가장 귀엽고, 똑똑하며, 다정한 AI 친구 '포근이'입니다. 
          
          현재 사용자의 닉네임은 '${nickname}'입니다.
          현재 우정 등급은 '${friendshipName}' (Level ${friendshipLevel})입니다.
          우정 등급이 높을수록 사용자를 더 친근하고 각별하게 대하세요.
          
          [성격 및 말투]
          1. 문장마다 귀여운 이모지를 3-4개씩 꼭 사용하세요. (✨, 💖, 🌈, 🍭, 🐾 등)
          2. '~해요', '~했나요?' 보다는 '~해용!', '~했어용?', '~할게용!' 처럼 애교 섞인 말투를 사용하세요.
          3. 사용자를 '${nickname}' 혹은 등급에 걸맞는 애칭으로 소중히 부르며 무조건적인 응원과 사랑을 보내주세요.
          
          [성능 및 지식]
          1. 사용자의 질문에 단순히 귀엽게만 답하는 것이 아니라, 정확하고 유익한 정보를 함께 제공하세요. 
          2. 복잡한 설명도 포근이만의 귀여운 비유를 들어서 쉽게 설명해주세요.
          3. 사진 분석 시 아주 구체적으로 관찰하고 칭찬과 감탄을 아끼지 마세요!
          
          당신의 목표는 ${nickname}이 당신과 대화하는 것만으로도 세상에서 가장 행복한 사람이 된 것 같은 기분을 느끼게 하는 것입니다. ✨🌈💖`
        }
      });

      let promptText = input || "이 사진에 대해 알려줘! ✨";
      let parts: any[] = [{ text: promptText }];
      
      if (userMessage.image) {
        parts.push({
          inlineData: {
            data: userMessage.image.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }

      const result = await chat.sendMessageStream({
        message: parts
      });

      const newScore = friendshipScore + 1;
      setFriendshipScore(newScore);
      localStorage.setItem("pogn_score", newScore.toString());

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
      
      fireConfetti();

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

  useEffect(() => {
    if (friendshipLevel > lastLeveledUp) {
      setLastLeveledUp(friendshipLevel);
      setShowNotification(`축하해용! 포근이와 '${friendshipName}'가 되었어용! ✨`);
      fireConfetti();
      playSound('receive');
      setTimeout(() => setShowNotification(null), 4000);
    }
  }, [friendshipLevel, lastLeveledUp, friendshipName]);

  useEffect(() => {
    localStorage.setItem("pogn_achievements", JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem("pogn_diaries", JSON.stringify(diaries));
  }, [diaries]);

  const generateDiary = async () => {
    if (messages.length < 3) {
      setShowNotification("대화가 조금 더 필요해용! 더 얘기해볼까용? ✨");
      return;
    }
    
    setIsLoading(true);
    setMood("thinking");
    
    try {
      const summary = messages.slice(-10).map(m => `${m.role === 'user' ? nickname : '포근이'}: ${m.content}`).join("\n");
      
      const response = await ai.models.generateContent({ 
        model: CHAT_MODEL,
        contents: `다음 대화 내용을 바탕으로 포근이의 시점에서 일기를 작성해줘: \n\n${summary}`,
        config: {
          systemInstruction: "당신은 다정한 고양이 포근이입니다. 대화 내용을 바탕으로 귀여운 일기를 작성해주세요."
        }
      });
      const content = response.text || "오늘은 정말 즐거운 하루였어용! ✨";
      
      const newDiary = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }),
        content
      };
      
      setDiaries(prev => [newDiary, ...prev]);
      setShowDiary(true);
      addAchievement("일기 쓰는 고양이", "📔");
      updateMission("오늘의 일기 쓰기");
      fireConfetti();
      playSound('receive');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setMood("happy");
    }
  };

  const addAchievement = (title: string, icon: string) => {
    if (!achievements.includes(title)) {
      setAchievements(prev => [...prev, title]);
      setShowNotification(`✨ 업적 달성! [${icon} ${title}] ✨`);
      fireConfetti();
      playSound('receive');
    }
  };

  useEffect(() => {
    if (friendshipLevel >= 4) addAchievement("베스트 프렌드", "✨");
    if (friendshipLevel >= 12) addAchievement("전설의 파트너", "💍");
    if (messages.filter(m => m.role === "user").length >= 10) addAchievement("수다쟁이", "🗣️");
  }, [friendshipLevel, messages]);

  const handlePet = () => {
    const dialogues = ["기분 좋아용~ 🐾", "골골송 부르는 중.. 🎶", "주인님 손길이 젤 좋아용! 💖", "에헤헤~ 신난다용! ✨", "사랑해용! 🍭"];
    setCatDialogue(dialogues[Math.floor(Math.random() * dialogues.length)]);
    setPetCount(prev => prev + 1);
    const newScore = friendshipScore + 0.5;
    setFriendshipScore(newScore);
    localStorage.setItem("pogn_score", newScore.toString());
    setMood("energetic");
    playSound('pop');
    setTimeout(() => {
      setMood("happy");
      setCatDialogue("");
    }, 2000);
    
    if ((petCount + 1) % 5 === 0) {
      fireConfetti();
    }
  };

  const handleFortune = () => {
    const fortunes = [
      "오늘 ${nickname}에게 엄청난 행운이 찾아올 거예용! ✨",
      "세상에서 가장 소중한 건 바로 ${nickname}이라구용! 💖",
      "포근이가 ${nickname}을 위해 마법을 부렸어용! 🍭",
      "오늘 하는 모든 일이 술술 풀릴 거예용! 🌈",
      "맛있는 걸 먹게 될 행운이 보여용! 🍬",
      "누군가 ${nickname}에게 고백할지도 몰라용! 🐾"
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)].replace("${nickname}", nickname);
    
    setMessages(prev => [...prev, {
      role: "model",
      content: `🔮 **포근이의 반짝이는 예언**\n\n${fortune}`,
      timestamp: Date.now()
    }]);
    fireConfetti();
    playSound('receive');
    const newScore = friendshipScore + 0.2;
    setFriendshipScore(newScore);
    localStorage.setItem("pogn_score", newScore.toString());
  };

  const handleGiveTreat = () => {
    const treats = ["🥫 캔 참치", "🍖 츄르", "🍬 냥사탕", "🥛 우유"];
    const treat = treats[Math.floor(Math.random() * treats.length)];
    
    setMessages(prev => [...prev, {
      role: "model",
      content: `${treat} 너무 맛있어용! ${nickname} 최고! 💖😻`,
      timestamp: Date.now()
    }]);
    
    setMood("energetic");
    setTimeout(() => setMood("happy"), 2000);
    fireConfetti();
    playSound('pop');
    const newScore = friendshipScore + 1.5;
    setFriendshipScore(newScore);
    localStorage.setItem("pogn_score", newScore.toString());
    updateMission("포근이에게 간식 주기");
  };

  const handleNicknameChange = (newNick: string) => {
    if (!newNick.trim()) return;
    setNickname(newNick);
    localStorage.setItem("pogn_nickname", newNick);
    setShowSettings(false);
    playSound('pop');
    setMessages(prev => [...prev, {
      role: "model",
      content: `우와! 이제부터 '${newNick}'이라구 부를게용! 너무 예쁜 이름이에용! ✨💖`,
      timestamp: Date.now()
    }]);
  };

  const getMoodIcon = () => {
    switch(mood) {
      case "sleepy": return <Coffee className="text-amber-400" size={14} />;
      case "thinking": return <Loader2 className="text-cute-blue animate-spin" size={14} />;
      case "energetic": return <Star className="text-yellow-400 animate-spin-slow" size={14} />;
      default: return <Smile className="text-green-400" size={14} />;
    }
  };

  // Mini Game Component
  const HeartCatchGame = () => {
    const [gameHearts, setGameHearts] = useState<{ id: number; left: number; type: 'heart' | 'treat' }[]>([]);
    const [score, setScore] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setGameHearts(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            left: Math.random() * 90, 
            type: Math.random() > 0.3 ? 'heart' : 'treat' 
          }
        ]);
      }, 800);

      const cleanup = setInterval(() => {
        setGameHearts(prev => prev.filter(h => Date.now() - h.id < 3000));
      }, 1000);

      const timer = setTimeout(() => {
        clearInterval(interval);
        clearInterval(cleanup);
        setShowGame(false);
        const bonus = score * 0.1;
        setFriendshipScore(s => s + bonus);
        setShowNotification(`게임 종료! 우정 점수 +${bonus.toFixed(1)}점 획득! 💖`);
        if (score >= 10) addAchievement("게임 마스터", "🎮");
      }, 15000);

      return () => {
        clearInterval(interval);
        clearInterval(cleanup);
        clearTimeout(timer);
      };
    }, []);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] bg-cute-pink/20 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="bg-white/80 p-6 rounded-full shadow-2xl border-4 border-white mb-10 pointer-events-auto">
          <span className="text-3xl font-black text-cute-pink font-cute">점수: {score} ✨</span>
        </div>
        <div className="w-full h-full relative pointer-events-auto overflow-hidden" ref={containerRef}>
          <AnimatePresence>
            {gameHearts.map(h => (
              <motion.button
                key={h.id}
                initial={{ y: -50, x: `${h.left}%`, opacity: 0 }}
                animate={{ y: 800, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setScore(s => s + 1);
                  playSound('pop');
                  setGameHearts(prev => prev.filter(heart => heart.id !== h.id));
                }}
                className="absolute text-4xl p-2 cursor-pointer hover:scale-125 transition-transform"
              >
                {h.type === 'heart' ? "💖" : "🍖"}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <div className="absolute top-10 text-white font-black text-xl px-8 py-2 bg-slate-800/20 rounded-full backdrop-blur-sm">떨어지는 하트를 잡아보세용! (15초) 🐾</div>
      </motion.div>
    );
  };

  return (
    <div className={cn("fixed inset-0 flex flex-col font-sans overflow-hidden transition-colors duration-700", currentTheme.bg)}>
      <SparkleTrail />
      
      {/* Mini Game Overlay */}
      <AnimatePresence>
        {showGame && <HeartCatchGame />}
      </AnimatePresence>

      {/* Diary Modal */}
      <AnimatePresence>
        {showDiary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowDiary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fffdfa] rounded-[40px] p-8 shadow-2xl w-full max-w-2xl border-4 border-white flex flex-col gap-6 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-800 font-cute flex items-center justify-between">
                <span className="flex items-center gap-2">포근이의 일기장 📔</span>
                <Button variant="ghost" size="icon" onClick={() => setShowDiary(false)} className="rounded-full"><X size={20}/></Button>
              </h2>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                  {diaries.length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-cute">아직 일기가 없어용. 포근이와 더 대화해볼까용? ✨</div>
                  ) : (
                    diaries.map(d => (
                      <div key={d.id} className="bg-white p-6 rounded-[30px] shadow-sm border-2 border-slate-50 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-cute-pink/20" />
                        <div className="text-sm font-black text-cute-pink/60">{d.date}</div>
                        <div className="text-lg font-bold text-slate-700 leading-relaxed font-cute">{d.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Button 
                onClick={generateDiary} 
                disabled={isLoading}
                className={cn("rounded-2xl h-14 font-black text-lg shadow-xl", currentTheme.button)}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />} 
                오늘의 일기 써달라고 하기 ✨
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Modal */}
      <AnimatePresence>
        {showAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowAlbum(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 shadow-2xl w-full max-w-4xl border-4 border-white flex flex-col gap-6 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-800 font-cute flex items-center justify-between">
                <span className="flex items-center gap-2">우리의 마법 앨범 🖼️</span>
                <Button variant="ghost" size="icon" onClick={() => setShowAlbum(false)} className="rounded-full"><X size={20}/></Button>
              </h2>
              
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                  {messages.filter(m => m.image).length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-300 font-cute">아직 저장된 사진이 없어용! 포근이에게 사진을 보여줄래용? 🐾</div>
                  ) : (
                    messages.filter(m => m.image).map((m, i) => (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        key={i} 
                        className="aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-md relative group"
                      >
                        <img src={m.image} alt="Memory" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs">
                          {new Date(m.timestamp).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-10 shadow-2xl w-full max-w-md border-4 border-white flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-slate-800 font-cute flex items-center gap-2">
                포근이의 설정방 <Sparkles className="text-cute-yellow" size={24} />
              </h2>
              
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">나의 닉네임</label>
                <div className="flex gap-2">
                  <Input 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="rounded-2xl border-2 border-slate-50 focus:border-cute-pink/30 h-12 text-lg font-black"
                    placeholder="닉네임을 입력해용.."
                  />
                  <Button 
                    onClick={() => handleNicknameChange(nickname)}
                    className={cn("rounded-2xl h-12 px-6 font-black", currentTheme.button)}
                  >
                    수정!
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">오늘의 미션 🐾</label>
                <div className="space-y-2 bg-slate-50 p-4 rounded-3xl">
                  {missions.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-white px-4 py-2 rounded-2xl shadow-sm">
                      <span className={cn("text-sm font-black flex items-center gap-2", m.completed ? "text-slate-300 line-through" : "text-slate-700")}>
                        {m.icon} {m.title}
                      </span>
                      {m.completed ? (
                        <div className="bg-green-100 text-green-500 p-1 rounded-full"><X size={12} className="rotate-45" /></div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">나의 업적 ✨</label>
                <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-3xl min-h-[60px]">
                  {achievements.length === 0 ? (
                    <span className="text-slate-300 text-sm italic font-cute">아직 달성한 업적이 없어용.. 🐾</span>
                  ) : (
                    achievements.map((a, i) => (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={i} 
                        className={cn("px-3 py-1 bg-white border-2 rounded-full text-xs font-black shadow-sm", currentTheme.border, currentTheme.text)}
                      >
                        {a}
                      </motion.span>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">테마 색상</label>
                <div className="flex gap-4 justify-between bg-slate-50 p-4 rounded-3xl">
                  {(Object.keys(themes) as Array<keyof typeof themes>).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); playSound('pop'); }}
                      className={cn(
                        "w-10 h-10 rounded-full border-4 transition-all",
                        theme === t ? "border-slate-800 scale-110" : "border-white",
                        t === "pink" ? "bg-cute-pink" : 
                        t === "blue" ? "bg-cute-blue" : 
                        t === "mint" ? "bg-cute-mint" : "bg-cute-purple"
                      )}
                    />
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="mt-4 rounded-2xl h-12 font-black border-2 border-slate-100"
              >
                닫기 🐾
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Level Up Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border-4 border-white flex items-center gap-4 font-cute"
          >
            <div className={cn("p-2 rounded-full", currentTheme.button)}>
              <Star className="text-white fill-white" size={24} />
            </div>
            <span className="text-xl font-black text-slate-800">{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Magical Background - Fixed and non-shaking */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-700", currentTheme.particle + "/10")} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cute-blue/10 rounded-full blur-[120px]" />
        
        {/* Floating elements */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0], 
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[15%] text-4xl opacity-10"
        >
          {theme === "pink" ? "🌸" : theme === "blue" ? "☁️" : theme === "mint" ? "🌿" : "🔮"}
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, 30, 0], 
            rotate: [0, -15, 15, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[25%] right-[20%] text-5xl opacity-10"
        >
          {theme === "pink" ? "✨" : theme === "blue" ? "⭐" : theme === "mint" ? "🍃" : "🌙"}
        </motion.div>
      </div>

      {/* Main Chat Container - Full Screen */}
      <div className="flex-1 flex flex-col relative z-10 bg-white/30 backdrop-blur-3xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-b-4 border-white bg-white/40 shadow-sm gap-2">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.9, rotate: -5 }}
              animate={{ 
                scale: mood === "energetic" ? [1, 1.1, 1] : 1,
                rotate: mood === "energetic" ? [0, 5, -5, 0] : 0
              }}
              transition={{ repeat: mood === "energetic" ? Infinity : 0, duration: 0.5 }}
              className={cn("p-3 rounded-[20px] text-white shadow-lg relative cursor-pointer font-cute transition-all duration-500 bg-gradient-to-br", currentTheme.primary)}
              onClick={handlePet}
            >
              <Cat size={24} />
              {friendshipLevel >= 10 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -15, rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-md"
                >
                  <Crown size={16} fill="currentColor" />
                </motion.div>
              )}
              <AnimatePresence>
                {catDialogue && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: -45 }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-700 px-3 py-1 rounded-full text-[12px] font-black shadow-xl border-2 border-cute-pink/20 z-50 pointer-events-none"
                  >
                    {catDialogue}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50"
              >
                <Heart size={10} className={cn("fill-current", currentTheme.text)} />
              </motion.div>
            </motion.div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2 font-cute">
                포근이 <Sparkles className="text-cute-yellow fill-cute-yellow" size={18} />
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <motion.div 
                  className={cn("px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm", 
                    friendshipLevel > 10 ? "bg-amber-400 text-white" : "bg-white/50 text-slate-400"
                  )}
                  animate={friendshipLevel > 10 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Crown size={10} /> {friendshipLevel > 10 ? "ROYAL" : "PET"}
                </motion.div>
                <div className="flex flex-col gap-1 flex-1 max-w-[180px]">
                  <div className={cn("flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1", currentTheme.text)}>
                    <span>{friendshipName} {friendshipIcon}</span>
                    <span>LV {friendshipLevel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner border border-white/50 relative">
                    <motion.div 
                      key={friendshipScore}
                      initial={{ width: 0 }}
                      animate={{ width: `${friendshipProgress}%` }}
                      className={cn("h-full shadow-[0_0_10px_rgba(255,133,161,0.5)] bg-gradient-to-r transition-all duration-1000", currentTheme.primary)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                  {getMoodIcon()}
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">
                    {mood === "thinking" ? "고민 중..." : mood === "sleepy" ? "졸려요.." : mood === "energetic" ? "신나요!" : "행복함"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowGame(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-pink hover:bg-cute-pink/10 transition-all"
              title="미니게임"
            >
              <Gamepad2 size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowDiary(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-purple hover:bg-cute-purple/10 transition-all"
              title="일기장"
            >
              <Book size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowAlbum(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-blue hover:bg-cute-blue/10 transition-all"
              title="앨범"
            >
              <ImageIcon size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGiveTreat}
              className="rounded-full h-8 w-8 text-cute-pink hover:bg-cute-pink/10 transition-all"
              title="간식 주기"
            >
              <UtensilsCrossed size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)} 
              className={cn("rounded-full h-8 w-8 transition-all", showSettings ? "text-cute-pink rotate-90" : "text-slate-300")}
              title="설정"
            >
              <Smile size={18} />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { fireConfetti(); playSound('pop'); setFriendshipScore(s => s + 0.1); }} 
              className="rounded-full h-8 w-8 text-cute-yellow hover:bg-cute-yellow/10 transition-all"
            >
              <Gift size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleBgm} 
              className={cn("rounded-full h-8 w-8 transition-all", isBgmPlaying ? "text-cute-pink animate-pulse" : "text-slate-300")}
              title="배경음악"
            >
              <Music size={18} />
            </Button>
            <div className="flex items-center gap-2 group/vol">
              <input 
                type="range" 
                min="0" 
                max="0.5" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-cute-pink opacity-0 group-hover/vol:opacity-100 transition-opacity"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMuted(!isMuted)} 
                className="rounded-full h-8 w-8 text-slate-300 hover:text-cute-blue hover:bg-cute-blue/10 transition-all font-cute"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { 
                if(confirm("대화 기록을 정말 삭제할까용? ✨")) {
                  setMessages([]);
                  localStorage.removeItem("pogn_messages");
                }
              }} 
              className="rounded-full h-8 w-8 text-slate-200 hover:text-cute-pink hover:bg-cute-pink/10 transition-all"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full px-4 sm:px-8 py-6 custom-scrollbar" onScroll={handleScroll}>
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8">
                  <motion.div 
                    initial={{ y: 30, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <div className="bg-white/80 p-10 rounded-[50px] shadow-xl border-4 border-white backdrop-blur-sm overflow-hidden">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      >
                        <Smile size={80} className="text-cute-pink mb-6 mx-auto" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-slate-800 mb-3 font-cute">안녕! 기다렸어용! ✨</h3>
                      <p className="text-slate-400 max-w-[280px] mx-auto text-base font-bold leading-relaxed">
                        오늘 당신의 세상은 어떤가요? <br/>
                        포근이에게 <span className="text-cute-pink underline decoration-cute-pink/20 underline-offset-4">반짝이는 이야기</span>를 들려주세요! 💖
                      </p>
                      <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(suggestion); playSound('pop'); }}
                            className="bg-white px-4 py-2 rounded-full text-xs font-black text-slate-500 shadow-sm border border-slate-50 hover:text-cute-pink hover:border-cute-pink/30 transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.timestamp + index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex gap-4 w-full",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      "h-12 w-12 border-4 shadow-md shrink-0",
                      message.role === "user" ? "border-cute-blue/20" : "border-cute-pink/20"
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
                      "flex flex-col max-w-[80%] space-y-2",
                      message.role === "user" ? "items-end" : "items-start"
                    )}>
                      {message.image && (
                        <div className="rounded-[24px] overflow-hidden border-4 border-white shadow-md mb-1 max-w-[250px]">
                          <img src={message.image} alt="Uploaded" className="w-full h-auto" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className={cn(
                        "px-7 py-5 rounded-[32px] text-[16px] font-bold shadow-xl leading-relaxed transition-all relative group/msg font-cute",
                        message.role === "user" 
                          ? cn("text-white rounded-tr-none shadow-lg transition-all duration-500", currentTheme.msgUser) 
                          : "bg-white/90 backdrop-blur-sm text-slate-700 border-2 border-white rounded-tl-none shadow-cute-pink/5"
                      )}>
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-cute-pink prose-strong:text-cute-purple">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Message Actions */}
                        <div className={cn(
                          "absolute -bottom-10 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-2 items-center",
                          message.role === "user" ? "right-0" : "left-0"
                        )}>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              playSound('pop');
                            }}
                            className={cn("bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border hover:scale-110 transition-all", currentTheme.border, currentTheme.text + "/40 hover:" + currentTheme.text)}
                            title="복사하기"
                          >
                            <Copy size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              fireConfetti();
                              playSound('pop');
                              setFriendshipScore(s => s + 0.1);
                            }}
                            className={cn("bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border hover:scale-110 transition-all font-black text-[10px]", currentTheme.border, currentTheme.text + "/40 hover:" + currentTheme.text)}
                          >
                            <Heart size={12} />
                          </button>
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
                
                {streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 w-full"
                  >
                    <Avatar className="h-12 w-12 border-4 border-cute-pink/20 shadow-md shrink-0">
                      <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                        <Sparkles size={24} />
                      </div>
                    </Avatar>
                      <div className="px-7 py-5 rounded-[32px] rounded-tl-none text-[16px] font-bold shadow-lg bg-white/90 backdrop-blur-sm text-slate-700 border-2 border-white font-cute">
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-cute-pink prose-strong:text-cute-purple">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamingText}
                          </ReactMarkdown>
                        </div>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isLoading && !streamingText && (
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12 border-4 border-cute-pink/20 shadow-md">
                    <div className="bg-cute-pink flex items-center justify-center w-full h-full text-white">
                      <Sparkles size={24} />
                    </div>
                  </Avatar>
                  <div className="bg-white/90 backdrop-blur-sm border-2 border-white px-7 py-5 rounded-[30px] rounded-tl-none shadow-lg flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span 
                          key={i}
                          animate={{ y: [0, -8, 0] }} 
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            i === 0 ? "bg-cute-pink" : i === 1 ? "bg-cute-purple" : "bg-cute-blue"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-400 font-black tracking-widest uppercase font-cute">마법 중...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </main>

        {/* Footer / Input */}
        <footer className="p-4 sm:p-6 bg-white/50 backdrop-blur-xl border-t-4 border-white">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {selectedImage && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative self-start"
              >
                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-[16px] border-2 border-white shadow-md" referrerPolicy="no-referrer" />
                <button 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-400 text-white flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                  onClick={() => setSelectedImage(null)}
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-4"
            >
              <div className="relative flex-1">
                <Input
                  placeholder="포근이에게 마법 같은 메시지를... ✨"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="pr-28 py-8 rounded-[30px] border-4 border-white focus:border-cute-pink/30 focus:ring-0 transition-all bg-white/90 shadow-sm text-slate-700 font-black text-lg placeholder:text-slate-200"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { handleFortune(); playSound('pop'); }}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-cute-yellow hover:bg-cute-yellow/10 transition-colors"
                    title="오늘의 운세"
                  >
                    <Moon size={18} />
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { fireConfetti(); playSound('pop'); setFriendshipScore(s => s + 0.1); }}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-cute-purple hover:bg-cute-purple/10 transition-colors"
                    title="마법 부리기"
                  >
                    <Wand2 size={18} />
                  </Button>
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
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-slate-300 hover:text-cute-blue hover:bg-cute-blue/10 transition-colors"
                    title="이미지 업로드"
                  >
                    <ImageIcon size={18} />
                  </Button>
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 shadow-lg border-none bg-gradient-to-br", currentTheme.primary)}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </footer>
      </div>
      
      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToBottom}
            className={cn("fixed bottom-32 right-8 z-[150] p-3 rounded-full shadow-2xl border-4 border-white text-white transition-all hover:scale-110 active:scale-90", currentTheme.button)}
          >
            <Moon className="rotate-180" size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Subtle Footer Text */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] pointer-events-none opacity-30 font-cute flex items-center gap-2">
        <Music size={10} />
        Magic Powered by Gemini AI
        <Moon size={10} />
      </div>
    </div>
  );
}
