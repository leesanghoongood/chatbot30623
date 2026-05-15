import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, Trash2, Heart, Smile, Star, Cat, Coffee, Image as ImageIcon, X, Music, Gift, Moon, Volume2, VolumeX, Copy, Wand2, Crown, UtensilsCrossed, Gamepad2, Book, Package, Home, Trophy, Camera, Gamepad, ShoppingCart, Medal, Check } from "lucide-react";
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
      if (Math.random() > 0.9) { // Reduced frequency from 0.8
        const id = Date.now();
        setTrails(prev => [...prev, { id, x: e.clientX, y: e.clientY }].slice(-10)); // Reduced count from 15
        setTimeout(() => {
          setTrails(prev => prev.filter(t => t.id !== id));
        }, 800); // Reduced duration from 1000
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
  const [volume, setVolume] = useState(0.2);
  const [nickname, setNickname] = useState(localStorage.getItem("pogn_nickname") || "친구님");
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [weather, setWeather] = useState<"clear" | "rain" | "snow" | "petals">("clear");
  const [magicDust, setMagicDust] = useState(Number(localStorage.getItem("pogn_dust")) || 0);
  const [showShop, setShowShop] = useState(false);
  const [roomItems, setRoomItems] = useState<string[]>(() => JSON.parse(localStorage.getItem("pogn_room_items") || "[]"));
  const [dreamMode, setDreamMode] = useState(false);
  const [wish, setWish] = useState<string | null>(null);
  const [isPhotoMode, setIsPhotoMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'happy' && !wish && Math.random() > 0.3) {
        const possibleWishes = ['fish', 'milk', 'yarn', 'ribbon', 'catnip', 'heart_cookie'];
        const w = possibleWishes[Math.floor(Math.random() * possibleWishes.length)];
        setWish(w);
        const itemNames: Record<string, string> = { 
          fish: '연어', 
          milk: '우유', 
          yarn: '실뭉치', 
          ribbon: '리본', 
          catnip: '캣닢', 
          heart_cookie: '하트 쿠키' 
        };
        setCatDialogue(`지금 딱 ${itemNames[w]}가 생각나용! 혹시... 줄 수 있나요? 🥺✨`);
        setTimeout(() => {
          setWish(null);
          setCatDialogue("");
        }, 60000); // Wish lasts 1 minute
      }
    }, 180000); // Every 3 minutes check
    return () => clearInterval(interval);
  }, [mood, wish]);

  useEffect(() => {
    localStorage.setItem("pogn_room_items", JSON.stringify(roomItems));
  }, [roomItems]);

  useEffect(() => {
    localStorage.setItem("pogn_dust", magicDust.toString());
  }, [magicDust]);

  useEffect(() => {
    // Random weather change every 10 minutes
    const weathers: ("clear" | "rain" | "snow" | "petals")[] = ["clear", "clear", "rain", "snow", "petals"];
    const interval = setInterval(() => {
      setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  const toggleRoom = () => {
    setShowRoom(!showRoom);
    playSound('pop');
  };

  const addItemToRoom = (itemId: string) => {
    if (!roomItems.includes(itemId)) {
      setRoomItems(prev => [...prev, itemId]);
      setShowNotification("🏠 방에 아이템을 배치했어용! ✨");
    }
  };
  const [missions, setMissions] = useState<{ title: string; completed: boolean; icon: string }[]>(() => {
    const saved = localStorage.getItem("pogn_missions");
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("pogn_last_mission_date");
    
    if (lastDate !== today) {
      return [
        { title: "포근이 5번 쓰다듬기", completed: false, icon: "🐾" },
        { title: "포근이에게 간식 주기", completed: false, icon: "🍖" },
        { title: "오늘의 일기 쓰기", completed: false, icon: "📔" },
        { title: "하트 잡기 게임 하기", completed: false, icon: "🎮" },
        { title: "마법 연금술 시도하기", completed: false, icon: "🧪" },
        { title: "포근이랑 1분 동안 대화하기", completed: false, icon: "🗣️" }
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

  const [pognThought, setPognThought] = useState("");

  useEffect(() => {
    const thoughts = [
      "졸려요.. 같이 낮잠 잘래용? 😴",
      "오늘따라 기분이 넘 좋아용! ✨",
      "연어.. 넘 먹고 싶어용.. 🐟",
      "우리 평생 친구 하는 거예용! 💖",
      "방이 넘 예뻐지는 것 같아용! 🏰",
      "새로운 장난감이 필요해용.. 🐭",
      "마법 가루가 반짝반짝! ✨",
      "하늘에 있는 구름이 솜사탕 같아용! ☁️"
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7 && !catDialogue && !showAlchemy && !showGame) {
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        setPognThought(thought);
        setTimeout(() => setPognThought(""), 4000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [catDialogue, showAlchemy, showGame]);

  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - sessionStartTime) / 1000;
      if (elapsed >= 60) {
        updateMission("포근이랑 1분 동안 대화하기");
        clearInterval(timer);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
  const [achievements, setAchievements] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("pogn_achievements") || "[]");
  });
  const [inventory, setInventory] = useState<{ id: string; name: string; icon: string; count: number }[]>(() => {
    return JSON.parse(localStorage.getItem("pogn_inventory") || "[]");
  });
  const [lastRewardDate, setLastRewardDate] = useState(localStorage.getItem("pogn_last_reward") || "");
  const [showInventory, setShowInventory] = useState(false);
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [alchemyIngredients, setAlchemyIngredients] = useState<string[]>([]);
  const [gameScore, setGameScore] = useState(0); // This was redundant in some edits, keeping one
  const [gameActive, setGameActive] = useState(false);
  const [album, setAlbum] = useState<{ id: string; url: string; date: string; caption: string }[]>(() => {
    return JSON.parse(localStorage.getItem("pogn_album") || "[]");
  });
  
  useEffect(() => {
    localStorage.setItem("pogn_album", JSON.stringify(album));
  }, [album]);

  useEffect(() => {
    localStorage.setItem("pogn_inventory", JSON.stringify(inventory));
  }, [inventory]);

  const toggleAlchemy = () => {
    setShowAlchemy(!showAlchemy);
    setAlchemyIngredients([]);
    playSound('pop');
  };

  const combineItems = () => {
    if (alchemyIngredients.length !== 2) return;
    
    const [id1, id2] = alchemyIngredients;
    // Consume items
    setInventory(prev => prev.map(i => {
      let deduct = 0;
      if (i.id === id1) deduct++;
      if (i.id === id2) deduct++;
      return { ...i, count: i.count - deduct };
    }).filter(i => i.count > 0));

    playSound('magic');
    fireConfetti();
    updateMission("마법 연금술 시도하기");
    
    let result = { name: "반짝이는 마법 가루", icon: "✨", score: 2 };
    if ((id1 === 'fish' && id2 === 'milk') || (id2 === 'fish' && id1 === 'milk')) {
      result = { name: "맛있는 고양이 푸딩", icon: "🍮", score: 10 };
    } else if ((id1 === 'yarn' && id2 === 'ribbon') || (id2 === 'yarn' && id1 === 'ribbon')) {
      result = { name: "마법의 장난감", icon: "🪄", score: 8 };
    } else if ((id1 === 'magic_stone' && id2 === 'potion') || (id2 === 'magic_stone' && id1 === 'potion')) {
      result = { name: "비밀의 결정체", icon: "🔮", score: 25 };
    } else if ((id1 === 'fish' && id2 === 'catnip') || (id2 === 'fish' && id1 === 'catnip')) {
      result = { name: "황금 연어", icon: "🍱", score: 15 };
    } else if ((id1 === 'potion' && id2 === 'catnip') || (id2 === 'potion' && id1 === 'catnip')) {
      result = { name: "꿈의 숲 조각", icon: "🌿", score: 20 };
    } else if ((id1 === 'ribbon' && id2 === 'magic_stone') || (id2 === 'ribbon' && id1 === 'magic_stone')) {
      result = { name: "별빛 티아라", icon: "👑", score: 30 };
    }

    setFriendshipScore(s => {
      const newScore = s + result.score;
      // Level up check
      if (Math.floor(newScore / 10) > Math.floor(s / 10)) {
        setTimeout(() => {
          fireConfetti();
          playSound('magic');
          setShowNotification(`✨ 축하해용! 우정 레벨이 ${Math.floor(newScore / 10)}으로 올랐어용! ✨`);
          setMood('energetic');
        }, 1000);
      }
      return newScore;
    });
    setMagicDust(d => d + (result.score * 2));
    
    // Check if result is a decoration
    if (result.name === "마법의 장난감") {
      addItemToRoom('toy');
    } else if (result.name === "꿈의 숲 조각") {
      addItemToRoom('forest');
    } else if (result.name === "별빛 티아라") {
      addItemToRoom('tiara');
    }
    
    setShowNotification(`🧪 연금술 성공! [${result.icon} ${result.name}]를 만들었어용! ✨`);
    setCatDialogue(`${result.name}!! 우와아 신기해용! 😻`);
    setMood('energetic');
    setShowAlchemy(false);
    
    setTimeout(() => setCatDialogue(""), 4000);
  };

  const startGame = () => {
    setGameScore(0);
    setGameActive(true);
    setMood('energetic');
    playSound('pop');
    updateMission("하트 잡기 게임 하기");
  };

  const endEmojiGame = () => {
    setGameActive(false);
    setMood('happy');
    const reward = Math.floor(gameScore / 5);
    const dustReward = Math.floor(gameScore / 2);
    if (reward > 0) {
      setFriendshipScore(s => s + reward);
      setMagicDust(d => d + dustReward);
      setShowNotification(`🎮 게임 종료! 보너스 우정 점수 +${reward}점, 마법 가루 +${dustReward} 획득! ✨`);
      fireConfetti();
    }
  };

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

  const [floatingIcons, setFloatingIcons] = useState<{ id: number; icon: string; x: number; y: number }[]>([]);

  const triggerFloatingIcon = (icon: string) => {
    const id = Date.now();
    const x = Math.random() * 60 + 20; // 20% to 80%
    const y = Math.random() * 40 + 30; // 30% to 70%
    setFloatingIcons(prev => [...prev, { id, icon, x, y }]);
    setTimeout(() => {
      setFloatingIcons(prev => prev.filter(f => f.id !== id));
    }, 2000);
  };

  const getCatIcon = (size: number) => {
    if (friendshipLevel >= 10) return <Cat size={size} className="animate-pulse" />;
    if (friendshipLevel >= 5) return <Cat size={size} />;
    return <Cat size={size} />;
  };

  const getCatAura = () => {
    if (friendshipLevel >= 10) return "shadow-[0_0_30px_rgba(251,191,36,0.5)]";
    if (friendshipLevel >= 5) return "shadow-[0_0_20px_rgba(244,114,182,0.3)]";
    return "shadow-lg";
  };

  const currentLevelInfo = friendshipLevels[Math.min(Math.floor(friendshipScore / 10), friendshipLevels.length - 1)];
  const friendshipLevel = currentLevelInfo.level;
  const friendshipName = currentLevelInfo.name;
  const friendshipIcon = currentLevelInfo.icon;
  const friendshipProgress = Math.min((friendshipScore % 10) * 10, 100);
  
  const [timeTheme, setTimeTheme] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setTimeTheme("bg-gradient-to-br from-orange-50/50 via-pink-50/50 to-blue-50/50"); // Morning
    else if (hour >= 11 && hour < 17) setTimeTheme("bg-gradient-to-br from-blue-50/50 via-white to-sky-50/50"); // Day
    else if (hour >= 17 && hour < 21) setTimeTheme("bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50"); // Evening
    else setTimeTheme("bg-gradient-to-br from-slate-900/10 via-indigo-900/10 to-slate-900/10"); // Night
  }, []);

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
    },
    gold: {
      primary: "from-yellow-400 via-amber-400 to-orange-400",
      bg: "bg-[#fffdf5]",
      border: "border-yellow-300",
      text: "text-amber-600",
      button: "bg-gradient-to-r from-yellow-500 to-amber-600",
      msgUser: "bg-gradient-to-br from-yellow-550 to-orange-600",
      particle: "bg-yellow-400"
    },
    dark: {
      primary: "from-slate-700 via-slate-800 to-slate-900",
      bg: "bg-slate-950",
      border: "border-slate-800",
      text: "text-slate-300",
      button: "bg-slate-700",
      msgUser: "bg-gradient-to-br from-slate-600 to-slate-800",
      particle: "bg-slate-500"
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

  const playSound = (type: 'send' | 'receive' | 'pop' | 'magic') => {
    if (isMuted) return;
    const sounds = {
      send: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      receive: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      pop: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3',
      magic: 'https://assets.mixkit.co/active_storage/sfx/2363/2363-preview.mp3'
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
    setFriendshipScore(prev => prev + 0.1);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    setMood("thinking");
    playSound('send');

    // Secret Command Check
    const lowInput = input.toLowerCase();
    if (lowInput.includes("불꽃놀이")) {
      fireConfetti();
      setShowNotification("✨ 펑펑! 아름다운 불꽃놀이에용! ✨");
    }
    if (lowInput.includes("사랑해")) {
      setMood("energetic");
      fireConfetti();
    }
    if (lowInput.includes("배고파")) {
      setCatDialogue("포근이도 배고파용! 맛있는 거 주세용! 🐟");
    }

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
          현재 포근이의 방에는 [${roomItems.join(", ")}] 아이템들이 장식되어 있습니다.
          현재 포근이의 기분은 '${mood}'입니다.
          현재 날씨는 '${weather}'입니다.
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
        addToAlbum(userMessage.image, input || "포근이와 함께 본 사진 ✨");
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
    localStorage.setItem("pogn_inventory", JSON.stringify(inventory));
  }, [inventory]);

  const checkDailyReward = () => {
    const today = new Date().toDateString();
    if (lastRewardDate !== today) {
      setShowGiftBox(true);
    }
  };

  useEffect(() => {
    checkDailyReward();
  }, []);

  const claimReward = () => {
    const today = new Date().toDateString();
    setLastRewardDate(today);
    localStorage.setItem("pogn_last_reward", today);
    setMagicDust(d => d + 20);
    
    const possibleItems = [
      { id: 'fish', name: '맛있는 연어', icon: '🐟' },
      { id: 'yarn', name: '마법 실뭉치', icon: '🧶' },
      { id: 'ribbon', name: '핑크 리본', icon: '🎀' },
      { id: 'milk', name: '신선한 우유', icon: '🥛' }
    ];
    
    const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    const dustBonus = Math.floor(Math.random() * 50) + 20;
    setMagicDust(d => d + dustBonus);
    addItemToInventory(randomItem);
    setShowGiftBox(false);
    setShowNotification(`🎁 보랏빛 상자에서 [${randomItem.icon} ${randomItem.name}]와 마법 가루 ${dustBonus}를 얻었어용! ✨`);
    fireConfetti();
  };

  const addItemToInventory = (item: { id: string; name: string; icon: string }) => {
    setInventory(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, count: i.count + 1 } : i);
      }
      return [...prev, { ...item, count: 1 }];
    });
  };

  const useItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.count <= 0) return;

    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0));
    
    if (itemId === 'potion') {
      setMood('sleepy');
      const prevTheme = theme;
      setTheme('purple');
      setShowNotification("🧪 꿈결 물약을 마셨어용... 포근이가 꿈의 세계로 안내해용! ✨");
      triggerFloatingIcon("🔮");
      setTimeout(() => {
        setTheme(prevTheme);
        setMood('happy');
      }, 15000);
    }
    
    playSound('pop');
    setMood('happy');
    const reactions = {
      fish: "냠냠! 연어가 입에서 살살 녹아용~ 🐟💖",
      yarn: "우와! 이거 넘 재미있어용! 같이 놀아용! 🧶✨",
      ribbon: "포근이 좀 예쁜가용? 어울리나용? 🎀🐾",
      milk: "고소한 우유~ 힘이 불끈불끈 나용! 🥛🌈",
      catnip: "우와아아아!! 기분이 넘넘 좋아용! 냥냥냥! 🍃✨",
      potion: "몽글몽글한 기분이 들어용... 꿈속을 걷는 것 같아용! 🧪✨",
      heart_cookie: "달콤한 쿠키! 우리 우정도 더 달콤해지겠네용! 🍪💖",
      magic_stone: "우와!! 이렇게 반짝이는 걸 저에게 주시다니!! 💎✨",
      lucky_bag: "뭐가 들어있을까용? 두근두근... 열어볼게용! 💰✨",
      cat_tower: "와아아!! 꿈에 그리던 캣타워에용! 여기서 살래용! 🏰😻"
    };

    if (itemId === 'lucky_bag') {
      const gachaItems = [
        { id: 'fish', name: '고급 연어', icon: '🐟' },
        { id: 'catnip', name: '마법 캣닢', icon: '🍃' },
        { id: 'potion', name: '꿈결 물약', icon: '🧪' },
        { id: 'magic_stone', name: '영롱한 보석', icon: '💎' }
      ];
      const gacha = gachaItems[Math.floor(Math.random() * gachaItems.length)];
      addItemToInventory(gacha);
      setShowNotification(`💰 복주머니에서 [${gacha.icon} ${gacha.name}]이 나왔어용! ✨`);
    }
    
    let scoreGain = 5;
    if (itemId === 'catnip') scoreGain = 15;
    if (itemId === 'magic_stone') scoreGain = 20;
    if (itemId === 'heart_cookie') scoreGain = 8;
    
    setCatDialogue(reactions[itemId as keyof typeof reactions] || "고마워용! ✨");
    setFriendshipScore(s => s + scoreGain);
    setMagicDust(d => d + Math.floor(scoreGain / 2));
    fireConfetti();
    triggerFloatingIcon("✨");
    
    if (itemId === 'fish') updateMission("포근이에게 간식 주기");
    if (itemId === 'ribbon' || itemId === 'yarn' || itemId === 'magic_stone' || itemId === 'cat_tower') addItemToRoom(itemId);
    
    if (itemId === 'rainbow_candy') {
      const themes: ("pink" | "blue" | "mint" | "purple")[] = ["pink", "blue", "mint", "purple"];
      const nextTheme = themes[Math.floor(Math.random() * themes.length)];
      setTheme(nextTheme);
      setMood('energetic');
      fireConfetti();
      triggerFloatingIcon("🌈");
      setShowNotification(`🍭 무지개 사탕의 마법! 분위기가 [${nextTheme}]로 바뀌었어용! ✨`);
    }
    
    if (itemId === 'potion') {
      setDreamMode(true);
      setMood('sleepy');
      setCatDialogue("우와아.. 몽글몽글 기분이 좋아용.. 꿈속인가용? 🧪✨");
      fireConfetti();
      setTimeout(() => {
        setDreamMode(false);
        setMood('happy');
        setCatDialogue("");
      }, 20000);
    }
    
    setTimeout(() => {
      setCatDialogue("");
    }, 4000);
  };

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
        content,
        friendshipAtTime: friendshipScore
      };
      
      setDiaries(prev => [newDiary, ...prev]);
      setShowDiary(true);
      setShowNotification("📔 포근이가 일기를 다 썼어용! ✨");
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

  const addToAlbum = (url: string, caption: string) => {
    const newItem = {
      id: Date.now().toString(),
      url,
      date: new Date().toLocaleDateString(),
      caption
    };
    setAlbum(prev => [newItem, ...prev]);
    addAchievement("기억 보관사", "🖼️");
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
    setPetCount(prev => {
      const newCount = prev + 1;
      if (newCount === 50) {
        addAchievement("포근이 마스터", "👑");
        setShowNotification("✨ 포근이가 당신을 진심으로 신뢰하게 되었어용! ✨");
        fireConfetti();
      }
      return newCount;
    });

    const isCritical = Math.random() > 0.9;
    const isTummy = Math.random() > 0.8;
    const gain = isCritical ? 1 : 0.1;

    if (isCritical) {
      triggerFloatingIcon("❤️");
      setCatDialogue("앗! 거기는 넘 기분 좋아용!! 😻✨");
      fireConfetti();
    } else if (isTummy) {
      triggerFloatingIcon("🐾");
      setCatDialogue("냥냥! 배 만지는 건 부끄러워용.. 😺");
    } else {
      triggerFloatingIcon("💖");
    }

    const newScore = friendshipScore + gain;
    setFriendshipScore(newScore);
    localStorage.setItem("pogn_score", newScore.toString());
    setMood("happy");
    playSound('pop');
    if (Math.random() > 0.5) triggerFloatingIcon("✨");
    
    // 10% 확률로 아이템 발견!
    if (Math.random() < 0.1) {
      const lootOptions = [
        { id: 'yarn', name: '마법 실뭉치', icon: '🧶' },
        { id: 'ribbon', name: '핑크 리본', icon: '🎀' },
        { id: 'toy', name: '장난감 쥐', icon: '🐭' }
      ];
      const loot = lootOptions[Math.floor(Math.random() * lootOptions.length)];
      addItemToInventory(loot);
      setShowNotification(`✨ 쓰다듬다가 발견했어용! [${loot.icon} ${loot.name}]`);
      fireConfetti();
    }

    setTimeout(() => {
      setCatDialogue("");
    }, 3000);
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
    triggerFloatingIcon("🍖");
    triggerFloatingIcon("✨");
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
    const [gameHearts, setGameHearts] = useState<{ id: number; left: number; type: 'heart' | 'treat' | 'gold_heart' | 'star' }[]>([]);
    const [score, setScore] = useState(0);
    const [currentTime, setCurrentTime] = useState(15);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const interval = setInterval(() => {
        const rand = Math.random();
        let type: 'heart' | 'treat' | 'gold_heart' | 'star' = 'heart';
        if (rand > 0.95) type = 'star';
        else if (rand > 0.85) type = 'gold_heart';
        else if (rand > 0.6) type = 'treat';

        setGameHearts(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            left: Math.random() * 90, 
            type
          }
        ]);
      }, 700);

      const timerInterval = setInterval(() => {
        setCurrentTime(t => Math.max(0, t - 1));
      }, 1000);

      const cleanup = setInterval(() => {
        setGameHearts(prev => prev.filter(h => Date.now() - h.id < 3000));
      }, 1000);

      const gameEndTimer = setTimeout(() => {
        clearInterval(interval);
        clearInterval(cleanup);
        clearInterval(timerInterval);
        setShowGame(false);
        const bonus = score * 0.1;
        setFriendshipScore(s => s + bonus);
        setShowNotification(`🎮 게임 종료! 점수: ${score} | 우정 점수 +${bonus.toFixed(1)}점! 💖`);
        if (score >= 20) addAchievement("게임 달인", "🔥");
      }, 15000);

      return () => {
        clearInterval(interval);
        clearInterval(cleanup);
        clearInterval(timerInterval);
        clearTimeout(gameEndTimer);
      };
    }, []);

    const handleCatch = (h: { id: number; type: string }) => {
      let points = 1;
      if (h.type === 'treat') points = 2;
      if (h.type === 'gold_heart') points = 5;
      if (h.type === 'star') {
        points = 1;
        setMagicDust(d => d + 10);
        triggerFloatingIcon("✨");
      }
      
      setScore(s => s + points);
      playSound('pop');
      setGameHearts(prev => prev.filter(heart => heart.id !== h.id));
      if (h.type === 'gold_heart' || h.type === 'star') fireConfetti();
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] bg-cute-pink/20 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="flex gap-4 mb-10 pointer-events-auto">
          <div className="bg-white/80 p-4 rounded-[25px] shadow-2xl border-4 border-white flex flex-col items-center min-w-[100px]">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Score</span>
            <span className="text-3xl font-black text-cute-pink font-cute">{score}</span>
          </div>
          <div className="bg-white/80 p-4 rounded-[25px] shadow-2xl border-4 border-white flex flex-col items-center min-w-[100px]">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Time</span>
            <span className="text-3xl font-black text-slate-700 font-cute">{currentTime}s</span>
          </div>
        </div>
        <div className="w-full h-full relative pointer-events-auto overflow-hidden" ref={containerRef}>
          <AnimatePresence>
            {gameHearts.map(h => (
              <motion.button
                key={h.id}
                initial={{ y: -50, x: `${h.left}%`, opacity: 0, scale: 0.5 }}
                animate={{ y: 900, opacity: 1, scale: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCatch(h);
                }}
                className={cn(
                  "absolute text-4xl p-2 cursor-pointer transition-transform hover:scale-125 z-10",
                  h.type === 'gold_heart' ? "drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "",
                  h.type === 'star' ? "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" : ""
                )}
              >
                {h.type === 'heart' ? "💖" : h.type === 'treat' ? "🍖" : h.type === 'gold_heart' ? "💝" : "⭐"}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <div className="absolute top-10 text-white font-black text-xl px-8 py-2 bg-slate-800/20 rounded-full backdrop-blur-sm">떨어지는 아이템들을 모두 탭하세용! ✨🐾</div>
      </motion.div>
    );
  };

  const WeatherOverlay = () => {
    const icons = {
      clear: [],
      rain: ["💧", "💧", "💧"],
      snow: ["❄️", "❄️", "❄️"],
      petals: ["🌸", "🌸", "✨"]
    };
    
    if (weather === "clear") return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, x: `${Math.random() * 100}%`, opacity: 0 }}
            animate={{ 
              y: 1000, 
              x: `${(Math.random() * 10) + (i * 5)}%`, 
              opacity: [0, 1, 1, 0],
              rotate: 360 
            }}
            transition={{ 
              duration: weather === "rain" ? 1 : 5, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-2xl"
          >
            {icons[weather][Math.floor(Math.random() * icons[weather].length)]}
          </motion.div>
        ))}
      </div>
    );
  };

  const buyItem = (item: { id: string; name: string; icon: string; cost: number }) => {
    if (magicDust >= item.cost) {
      setMagicDust(d => d - item.cost);
      addItemToInventory({ id: item.id, name: item.name, icon: item.icon });
      setShowNotification(`🛍️ 구매 성공! [${item.icon} ${item.name}]이 가방에 들어왔어용! ✨`);
      
      // Auto-equip if it's a room deco
      if (item.id === 'magic_stone' || item.id === 'yarn' || item.id === 'cat_tower' || item.id === 'ribbon') {
        addItemToRoom(item.id);
      }
      
      fireConfetti();
      playSound('receive');
    } else {
      setShowNotification("😿 아직 마법 가루가 부족해용... 더 많이 놀아주세용! ✨");
    }
  };

  const shopItems = [
    { id: 'fish', name: '고급 연어', icon: '🐟', cost: 10, desc: "포근이가 가장 좋아하는 최고급 연어에용!" },
    { id: 'catnip', name: '마법 캣닢', icon: '🍃', cost: 30, desc: "포근이를 엄청 신나게 만들어줘용! (우정 대폭 상승)" },
    { id: 'magic_stone', name: '영롱한 보석', icon: '💎', cost: 100, desc: "방을 장식할 수 있는 아주 희귀하고 예쁜 보석이에용!" },
    { id: 'yarn', name: '마법 실뭉치', icon: '🧶', cost: 15, desc: "방에 놓으면 포근이가 신나게 놀아용!" },
    { id: 'potion', name: '꿈결 물약', icon: '🧪', cost: 50, desc: "포근이의 꿈속 이야기를 들을 수 있을지도 몰라용!" },
    { id: 'heart_cookie', name: '하트 쿠키', icon: '🍪', cost: 5, desc: "작지만 달콤한 우정의 증표에용! ✨" },
    { id: 'ribbon', name: '핑크 리본', icon: '🎀', cost: 12, desc: "포근이의 방을 더 러블리하게 꾸며줘용! 💖" },
    { id: 'cat_tower', name: '폭신폭신 캣타워', icon: '🏰', cost: 150, desc: "포근이가 가장 갖고 싶어하는 꿈의 성이에용!" },
    { id: 'lucky_bag', name: '행운의 복주머니', icon: '💰', cost: 40, desc: "어떤 선물이 들어있을지 몰라용! 두근두근! 🐾" },
    { id: 'rainbow_candy', name: '무지개 사탕', icon: '🍭', cost: 15, desc: "포근이의 색깔이 바뀔지도...? (랜덤 테마 변경)" },
    { id: 'magic_wand', name: '마법 지팡이', icon: '🪄', cost: 200, desc: "포근이와 함께라면 무엇이든 할 수 있을 것 같아용!" }
  ];

  const [showMissions, setShowMissions] = useState(false);

  const [showAchievements, setShowAchievements] = useState(false);

  const achievementDetails: { [key: string]: { icon: string, desc: string } } = {
    "첫 만남": { icon: "👋", desc: "포근이를 처음 만났어용!" },
    "베스트 프렌드": { icon: "✨", desc: "포근이와 아주 친한 사이가 되었어용!" },
    "전설의 파트너": { icon: "💍", desc: "포근이에게 가장 소중한 사람이 되었어용!" },
    "수다쟁이": { icon: "🗣️", desc: "포근이와 10번 이상 대화했어용!" },
    "포근이 마스터": { icon: "👑", desc: "우정의 정점에 도달했어용!" },
    "게임 달인": { icon: "🔥", desc: "게임에서 높은 점수를 기록했어용!" },
    "일기 쓰는 고양이": { icon: "📔", desc: "일기장에 첫 추억을 남겼어용!" },
    "기억 보관사": { icon: "🖼️", desc: "앨범에 추억을 저장했어용!" }
  };

  const getMoodAuraColor = () => {
    switch (mood) {
      case 'happy': return "from-yellow-200/40 to-amber-200/40";
      case 'sleepy': return "from-indigo-200/40 to-purple-200/40";
      case 'energetic': return "from-rose-400/20 to-pink-400/20";
      default: return "from-white/20 to-slate-200/20";
    }
  };

  const AchievementsModal = () => {
    return (
      <AnimatePresence>
        {showAchievements && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[865] bg-amber-500/10 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-xl p-10 rounded-[50px] shadow-2xl border-4 border-white max-w-lg w-full font-cute"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-400 p-3 rounded-[24px] text-white">
                    <Medal size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">우리의 추억 🏆</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAchievements(false)} className="rounded-full">
                  <X />
                </Button>
              </div>

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(achievementDetails).map(([title, detail], i) => {
                    const isUnlocked = achievements.includes(title);
                    return (
                      <motion.div 
                        key={title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-center gap-5 p-5 rounded-[30px] border-4 transition-all shadow-sm",
                          isUnlocked ? "bg-white border-amber-200" : "bg-slate-50 border-slate-100 grayscale opacity-40"
                        )}
                      >
                        <div className="text-5xl">{detail.icon}</div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-xl font-black text-slate-800 leading-none">
                            {isUnlocked ? title : "???"}
                          </h4>
                          <p className="text-sm text-slate-400 font-bold leading-tight">
                            {isUnlocked ? detail.desc : "아직 발견하지 못했어용..."}
                          </p>
                        </div>
                        {isUnlocked && (
                          <div className="ml-auto bg-amber-400 text-white p-2 rounded-full shadow-lg scale-75">
                            <Check size={16} strokeWidth={4} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <div className="mt-8 p-6 bg-amber-50 rounded-[35px] border-2 border-amber-100 text-center">
                <p className="text-sm font-bold text-amber-700">
                  포근이와의 추억이 늘어날수록 더 많은 업적이 잠금 해제되어용! ✨
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };
  const moodEmojiMap = {
    happy: "😺",
    sleepy: "😴",
    energetic: "😼",
    thinking: "🤔"
  };

  return (
    <div className={cn("fixed inset-0 flex flex-col font-sans overflow-hidden transition-colors duration-1000", currentTheme.bg, timeTheme, dreamMode && "bg-slate-900")}>
      <SparkleTrail />
      <WeatherOverlay />
      
      {isPhotoMode && (
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsPhotoMode(false)}
          className="fixed top-6 right-6 z-[1000] bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/40 transition-all font-black"
        >
          돌아가기 📸
        </motion.button>
      )}

      <AnimatePresence>
        {dreamMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] bg-indigo-900/40 backdrop-blur-[2px]"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute text-white/40"
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%`,
                  fontSize: `${Math.random() * 10 + 10}px`
                }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
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
                    <div className="text-center py-20 text-slate-300 font-cute">아직 일기가 없어용. 포근이와 더 대화해보면 일기를 써줄 거예용! ✨</div>
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
      </div>

      {/* Main Chat Container - Full Screen */}
      <div className={cn("flex-1 flex flex-col relative z-10 bg-white/30 backdrop-blur-3xl transition-opacity duration-500", isPhotoMode && "opacity-0 pointer-events-none")}>
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
              className={cn("p-3 rounded-[20px] text-white relative cursor-pointer font-cute transition-all duration-500 bg-gradient-to-br", currentTheme.primary, getCatAura())}
              onClick={handlePet}
            >
              {getCatIcon(24)}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm border border-slate-100">
                {moodEmojiMap[mood]}
              </div>
              
              {/* Floating Icons for Header Cat */}
              <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                  {floatingIcons.map(f => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, scale: 0, y: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8], y: -80 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5 }}
                      className="absolute text-2xl -left-2"
                      style={{ top: '0%' }}
                    >
                      {f.icon}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

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
                  <div className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                    <Sparkles size={10} fill="currentColor" /> {magicDust}
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
          
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowShop(true); playSound('pop'); }} 
              className={cn("rounded-full h-8 w-8 transition-all", showShop ? "text-amber-500 bg-amber-50" : "text-slate-300")}
              title="마법 상점 🛍️"
            >
              <ShoppingCart size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowInventory(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-blue hover:bg-cute-blue/10 transition-all"
              title="포근이의 가방 🎒"
            >
              <Package size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleRoom} 
              className={cn("rounded-full h-8 w-8 transition-all", showRoom ? "text-cute-pink bg-cute-pink/10" : "text-slate-300")}
              title="포근이의 비밀 방 🏠"
            >
              <Home size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsPhotoMode(!isPhotoMode)} 
              className={cn("rounded-full h-8 w-8 transition-all", isPhotoMode ? "text-cute-pink bg-cute-pink/10" : "text-slate-300")}
              title="사진 모드 (UI 숨기기) 📸"
            >
              <Camera size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowAlbum(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-blue hover:bg-cute-blue/10 transition-all"
              title="앨범 📸"
            >
              <Camera size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleAlchemy} 
              className={cn("rounded-full h-8 w-8 transition-all", showAlchemy ? "text-cute-purple bg-cute-purple/10" : "text-slate-300")}
              title="마법 연금술 (아이템 조합) 🧪"
            >
              <Wand2 size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowMissions(true); playSound('pop'); }} 
              className={cn("rounded-full h-8 w-8 transition-all", showMissions ? "text-cute-pink bg-cute-pink/10" : "text-slate-300")}
              title="오늘의 미션 🐾"
            >
              <Trophy size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowAchievements(true); playSound('pop'); }} 
              className={cn("rounded-full h-8 w-8 transition-all", showAchievements ? "text-amber-500 bg-amber-50" : "text-slate-300")}
              title="업적 확인 🏆"
            >
              <Medal size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowDiary(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-purple hover:bg-cute-purple/10 transition-all"
              title="일기장 📔"
            >
              <Book size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setShowGame(true); playSound('pop'); }} 
              className="rounded-full h-8 w-8 text-cute-pink hover:bg-cute-pink/10 transition-all"
              title="미니게임 🎮"
            >
              <Gamepad2 size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGiveTreat}
              className="rounded-full h-8 w-8 text-cute-pink hover:bg-cute-pink/10 transition-all"
              title="간식 주기 🍖"
            >
              <UtensilsCrossed size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)} 
              className={cn("rounded-full h-8 w-8 transition-all", showSettings ? "text-cute-pink rotate-90" : "text-slate-300")}
              title="설정 ⚙️"
            >
              <Smile size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleBgm} 
              className={cn("rounded-full h-8 w-8 transition-all", isBgmPlaying ? "text-cute-pink animate-pulse" : "text-slate-300")}
              title="배경음악 🎶"
            >
              <Music size={18} />
            </Button>
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
              title="대화 삭제 🗑️"
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

      {/* Room Modal */}
      <AnimatePresence>
        {showRoom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-white/60 backdrop-blur-3xl flex items-center justify-center p-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />
            
            <div className="relative w-full h-full flex flex-col p-8 max-w-5xl">
              <div className="flex justify-between items-center z-10">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 font-cute text-center sm:text-left">포근이의 비밀 방 🏠</h2>
                  <p className="text-slate-400 font-bold mt-2 text-center sm:text-left">나만의 공간에서 편히 쉬고 있어용! ✨</p>
                </div>
                <Button 
                  onClick={() => setShowRoom(false)}
                  className="rounded-full h-14 w-14 bg-white shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-cute-pink border-none"
                >
                  <X size={30} />
                </Button>
              </div>

              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Furniture Items */}
                <div className="absolute inset-0 pointer-events-none">
                  {roomItems.includes('yarn') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      whileTap={{ scale: 1.2 }}
                      onClick={(e) => { e.stopPropagation(); playSound('pop'); triggerFloatingIcon("🧶"); }}
                      className="absolute bottom-[20%] left-[10%] text-7xl drop-shadow-xl z-10 pointer-events-auto cursor-pointer" 
                      title="마법 실뭉치"
                    >
                      🧶
                    </motion.div>
                  )}
                  {roomItems.includes('ribbon') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      whileTap={{ scale: 1.1 }}
                      onClick={(e) => { e.stopPropagation(); playSound('pop'); triggerFloatingIcon("🎀"); }}
                      className="absolute top-[30%] right-[15%] text-6xl drop-shadow-xl z-0 pointer-events-auto cursor-pointer" 
                      title="핑크 리본"
                    >
                      🎀
                    </motion.div>
                  )}
                  {roomItems.includes('toy') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      whileTap={{ scale: 0.9, rotate: -20 }}
                      onClick={(e) => { e.stopPropagation(); playSound('pop'); triggerFloatingIcon("🐭"); }}
                      className="absolute bottom-[10%] right-[20%] text-5xl rotate-12 drop-shadow-lg z-10 pointer-events-auto cursor-pointer" 
                      title="장난감 쥐"
                    >
                      🐭
                    </motion.div>
                  )}
                  {roomItems.includes('magic_stone') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => { e.stopPropagation(); playSound('magic'); triggerFloatingIcon("💎"); fireConfetti(); }}
                      className="absolute top-[20%] left-[20%] text-5xl drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] z-0 pointer-events-auto cursor-pointer" 
                      title="영롱한 보석"
                    >
                      💎
                    </motion.div>
                  )}
                  {roomItems.includes('cat_tower') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute bottom-[10%] left-[5%] text-9xl drop-shadow-2xl z-0 pointer-events-auto cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); playSound('pop'); triggerFloatingIcon("🏰"); }}
                      title="폭신폭신 캣타워"
                    >
                      🏰
                    </motion.div>
                  )}
                  {roomItems.includes('forest') && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 0.4 }} 
                      className="absolute top-[5%] left-[35%] text-[120px] blur-[2px] z-0 pointer-events-none" 
                      title="꿈의 숲"
                    >
                      🌳
                    </motion.div>
                  )}
                  {roomItems.includes('tiara') && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ 
                        scale: 1,
                        y: [0, -15, 0]
                      }} 
                      transition={{ 
                        scale: { duration: 0.5 },
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="absolute top-[18%] left-[45%] text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] z-20 pointer-events-auto cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); playSound('magic'); triggerFloatingIcon("👑"); }}
                      title="별빛 티아라"
                    >
                      👑
                    </motion.div>
                  )}
                </div>

                {/* The Big Cat */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative cursor-pointer group"
                  onClick={handlePet}
                >
                  <div className="absolute -inset-10 bg-cute-pink/10 rounded-full blur-3xl group-hover:bg-cute-pink/20 transition-all" />
                  
                  {/* Mood Aura */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className={cn("absolute -inset-20 rounded-full blur-[80px] bg-gradient-to-br transition-all duration-1000", getMoodAuraColor())} 
                  />

                  <Cat size={240} className={cn("transition-colors duration-1000 relative drop-shadow-2xl", currentTheme.text, friendshipLevel >= 10 && "animate-pulse")} />
                  
                  {friendshipLevel >= 10 && (
                    <div className="absolute inset-0 bg-yellow-400/10 rounded-full blur-[100px] animate-pulse" />
                  )}

                  {/* Pogn's Thought Bubble */}
                  <AnimatePresence>
                    {pognThought && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: -20, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-[30px] border-4 border-white shadow-xl z-50 min-w-[200px] text-center"
                      >
                        <p className="text-slate-700 font-bold text-lg whitespace-nowrap">{pognThought}</p>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-b-4 border-r-4 border-white rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Floating Icons Container */}
                  <div className="absolute inset-0 pointer-events-none z-40">
                    <AnimatePresence>
                      {floatingIcons.map(f => (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, scale: 0, y: 0 }}
                          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1], y: -150, x: (Math.random() - 0.5) * 50 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute text-5xl"
                          style={{ left: `${f.x}%`, top: `${f.y}%` }}
                        >
                          {f.icon}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Mood Bubble in Room */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-10 -right-10 bg-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-4 border-white z-30"
                  >
                    {moodEmojiMap[mood]}
                  </motion.div>
                  
                  <AnimatePresence>
                    {catDialogue && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1, y: -80 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 bg-white px-8 py-4 rounded-[40px] shadow-2xl border-4 border-slate-50 text-xl font-black text-slate-700 whitespace-nowrap z-20 font-cute"
                      >
                        {catDialogue}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Status Section in Room */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 z-10">
                <div className="bg-white/80 p-4 sm:p-6 rounded-[35px] shadow-xl border-4 border-white flex flex-col items-center gap-2">
                  <div className="text-2xl sm:text-3xl">💖</div>
                  <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">친밀도</span>
                  <div className="text-xl sm:text-2xl font-black text-cute-pink">{Math.floor(friendshipScore)}</div>
                </div>
                <div className="bg-white/80 p-4 sm:p-6 rounded-[35px] shadow-xl border-4 border-white flex flex-col items-center gap-2">
                  <div className="text-2xl sm:text-3xl">✨</div>
                  <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">레벨</span>
                  <div className="text-xl sm:text-2xl font-black text-cute-purple">{friendshipLevel}</div>
                </div>
                <div className="bg-white/80 hidden sm:flex p-6 rounded-[35px] shadow-xl border-4 border-white flex flex-col items-center gap-2">
                  <div className="text-3xl">🐾</div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">방 물건</span>
                  <div className="text-2xl font-black text-cute-blue">{roomItems.length}개</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Gift Overlay */}
      <AnimatePresence>
        {showGiftBox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[50px] p-10 text-center shadow-2xl relative max-w-sm w-full font-cute"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Gift size={100} className="text-cute-pink drop-shadow-lg" />
                </motion.div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 mt-10 mb-4">오늘의 보물 상자! ✨</h2>
              <p className="text-slate-500 mb-8 font-bold">포근이가 당신을 위해 선물을 물어왔어용! 얼른 확인해보세용! 🐾</p>
              <Button 
                onClick={claimReward}
                className="w-full py-8 text-xl font-black rounded-full bg-cute-pink hover:bg-cute-pink/90 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                열어보기! 🎁
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Board Modal */}
      <AchievementsModal />
      <AnimatePresence>
        {showMissions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[860] bg-cute-pink/10 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowMissions(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-xl p-10 rounded-[50px] shadow-2xl border-4 border-white max-w-md w-full font-cute"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-cute-pink p-3 rounded-[24px] text-white">
                    <Trophy size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">오늘의 도전 🐾</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowMissions(false)} className="rounded-full">
                  <X />
                </Button>
              </div>

              <div className="space-y-4 mb-8">
                {missions.map((m, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={cn(
                      "flex items-center justify-between p-5 rounded-[30px] border-4 transition-all shadow-sm",
                      m.completed ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-cute-pink/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner",
                        m.completed ? "bg-slate-100" : "bg-cute-pink/5"
                      )}>
                        {m.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("text-lg font-black", m.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                          {m.title}
                        </span>
                        <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">우정 점수 +5점</span>
                      </div>
                    </div>
                    {m.completed ? (
                      <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                        <Sparkles size={16} fill="currentColor" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 border-4 border-slate-100 rounded-full" />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="bg-cute-pink/5 p-6 rounded-[35px] border-2 border-cute-pink/10 text-center">
                <p className="text-sm font-bold text-cute-pink">
                  모든 미션을 완료하면 특별한 마법 가루가 생길지도 몰라용! ✨
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[870] bg-amber-500/10 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowShop(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-xl p-10 rounded-[50px] shadow-2xl border-4 border-white max-w-2xl w-full font-cute flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-400 p-3 rounded-[24px] text-white">
                    <ShoppingCart size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">포근이의 마법 상점 🛍️</h2>
                    <div className="flex items-center gap-2 text-amber-500 font-bold mt-1">
                      <Sparkles size={16} fill="currentColor" /> {magicDust} 가루 보유 중
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowShop(false)} className="rounded-full">
                  <X />
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shopItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white border-4 border-slate-50 p-6 rounded-[35px] shadow-sm flex flex-col gap-4 group hover:border-amber-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-5xl group-hover:scale-110 transition-transform">{item.icon}</div>
                        <div className="bg-amber-50 px-4 py-2 rounded-2xl text-amber-600 font-black flex items-center gap-2">
                          <Sparkles size={14} fill="currentColor" /> {item.cost}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800">{item.name}</h4>
                        <p className="text-sm text-slate-400 font-bold leading-tight mt-1">{item.desc}</p>
                      </div>
                      <Button 
                        onClick={() => buyItem(item)}
                        disabled={magicDust < item.cost}
                        className="w-full rounded-2xl bg-amber-400 hover:bg-amber-500 text-white font-black py-4 h-auto shadow-md disabled:opacity-30"
                      >
                        구매하기 ✨
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-8 p-6 bg-amber-50 rounded-[30px] border-2 border-amber-100">
                <p className="text-xs font-bold text-amber-700 leading-relaxed text-center">
                  마법 가루는 연금술 성공, 쓰다듬기, 일기 쓰기 등으로 얻을 수 있어용! 🪄
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alchemy Modal */}
      <AnimatePresence>
        {showAlchemy && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[850] bg-cute-purple/20 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowAlchemy(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-xl p-10 rounded-[50px] shadow-2xl border-4 border-white max-w-lg w-full font-cute"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-cute-purple p-3 rounded-[24px] text-white animate-pulse">
                    <Wand2 size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">포근이의 비밀 실험실 🧪</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAlchemy(false)} className="rounded-full">
                  <X />
                </Button>
              </div>

              <div className="bg-slate-50 p-6 rounded-[35px] border-2 border-slate-100 flex items-center justify-around mb-10 min-h-[120px]">
                {alchemyIngredients.length === 0 ? (
                  <p className="text-slate-400 font-bold text-center">아이템을 2개 선택해주세용! ✨</p>
                ) : (
                  <div className="flex items-center gap-6">
                    {alchemyIngredients.map((id, index) => {
                      const item = inventory.find(i => i.id === id);
                      return (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div className="text-5xl bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100">{item?.icon}</div>
                          <span className="text-xs font-black text-slate-400">{item?.name}</span>
                        </div>
                      );
                    })}
                    {alchemyIngredients.length === 1 && <div className="text-4xl text-slate-200 animate-bounce">?</div>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {inventory.map(item => (
                  <button
                    key={item.id}
                    disabled={item.count <= 0 || (alchemyIngredients.includes(item.id) && item.count === 1)}
                    onClick={() => {
                      if (alchemyIngredients.includes(item.id)) {
                        setAlchemyIngredients(prev => prev.filter(i => i !== item.id));
                      } else if (alchemyIngredients.length < 2) {
                        setAlchemyIngredients(prev => [...prev, item.id]);
                        playSound('pop');
                      }
                    }}
                    className={cn(
                      "p-4 rounded-[30px] border-4 transition-all flex items-center gap-4 group",
                      alchemyIngredients.includes(item.id) 
                        ? "bg-cute-purple/5 border-cute-purple shadow-lg" 
                        : "bg-white border-slate-50 hover:border-cute-purple/30 shadow-sm"
                    )}
                  >
                    <div className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-slate-700 text-sm leading-none mb-1">{item.name}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.count}개</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button 
                onClick={combineItems}
                disabled={alchemyIngredients.length !== 2}
                className="w-full py-8 text-xl font-black rounded-full bg-cute-purple hover:bg-cute-purple/90 text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
              >
                연금술 시작!! 🔮
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowInventory(false)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white/95 backdrop-blur-xl h-full w-full max-w-md absolute right-0 p-8 shadow-2xl flex flex-col font-cute"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-cute-blue p-2 rounded-2xl text-white">
                    <Package size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">포근이의 가방 🐾</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowInventory(false)} className="rounded-full">
                  <X />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {inventory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Package size={60} className="mb-4 text-slate-300" />
                    <p className="font-bold text-lg">가방이 텅 비어있어용..<br/>포근이가 선물을 물어올 때까지 기다려용! ✨</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {inventory.map((item) => (
                      <motion.div 
                        key={item.id}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white border-4 border-slate-50 p-4 rounded-[30px] shadow-sm flex flex-col items-center gap-3 group relative"
                      >
                        <div className="text-4xl">{item.icon}</div>
                        <span className="font-black text-slate-700">{item.name}</span>
                        <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black text-slate-400">
                          {item.count}개 보유
                        </div>
                        <Button 
                          onClick={() => useItem(item.id)}
                          className="w-full mt-2 rounded-xl bg-cute-pink/10 hover:bg-cute-pink text-cute-pink hover:text-white transition-all text-sm font-black py-1 h-auto"
                        >
                          사용하기 ✨
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-8 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100">
                <h4 className="font-black text-slate-400 text-xs mb-3 uppercase tracking-widest">수집 팁! 🍭</h4>
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  포근이를 쓰다듬으면 가끔 바닥에서 선물을 발견할 수 있어용!<br/>
                  매일매일 출석해서 보물 상자도 열어보세용! ✨
                </p>
              </div>
            </motion.div>
          </motion.div>
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
