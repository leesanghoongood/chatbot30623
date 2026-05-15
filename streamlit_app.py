import streamlit as st
import google.generativeai as genai
import os
import time
import random
from datetime import datetime

# 페이지 설정
st.set_page_config(page_title="포근이: 당신의 마법 고양이 AI ✨", page_icon="🐾", layout="wide")

# CSS로 귀엽게 꾸미기
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap');
    
    .stApp {
        background: linear-gradient(135deg, #fff5f8 0%, #eef9ff 100%);
    }
    .main .block-container {
        padding-top: 2rem;
        max-width: 800px !important;
    }
    h1, h2, h3, .stMarkdown, p {
        font-family: 'Gaegu', cursive !important;
    }
    .stChatMessage {
        border-radius: 30px !important;
        padding: 22px !important;
        margin-bottom: 20px !important;
        border: 4px solid #fff !important;
        box-shadow: 0 8px 30px rgba(255, 133, 161, 0.08) !important;
        background: rgba(255, 255, 255, 0.6) !important;
        backdrop-filter: blur(10px);
    }
    .stChatMessage[data-testimonial="user"] {
        background-color: rgba(123, 223, 242, 0.15) !important;
    }
    .stChatInputContainer {
        border: none !important;
        padding: 1.5rem !important;
        background: transparent !important;
    }
    .stChatInput {
        border: 4px solid white !important;
        border-radius: 40px !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08) !important;
        background: white !important;
    }
    .stButton>button {
        width: 100%;
        border-radius: 20px !important;
        background: white !important;
        color: #ff85a1 !important;
        border: 3px solid #ffe4ec !important;
        font-weight: bold !important;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        font-family: 'Gaegu', cursive !important;
        font-size: 1.1rem !important;
    }
    .stButton>button:hover {
        background: #ff85a1 !important;
        color: white !important;
        transform: scale(1.05);
        border-color: #ff85a1 !important;
    }
    .sidebar-card {
        background: white;
        padding: 1.5rem;
        border-radius: 25px;
        border: 4px solid #fff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
    }
    .achievement-tag {
        display: inline-block;
        padding: 4px 12px;
        background: #fff;
        border: 2px solid #ff85a1;
        border-radius: 50px;
        font-size: 0.8rem;
        font-weight: bold;
        color: #ff85a1;
        margin: 2px;
    }
    .mission-item {
        padding: 8px;
        border-radius: 12px;
        background: #f8fbff;
        margin-bottom: 6px;
        font-size: 0.9rem;
    }
    .completed {
        text-decoration: line-through;
        opacity: 0.5;
    }
    </style>
    """, unsafe_allow_html=True)

# 초기 세션 상태 설정
if "nickname" not in st.session_state:
    st.session_state.nickname = "친구님"
if "messages" not in st.session_state:
    st.session_state.messages = []
if "friendship" not in st.session_state:
    st.session_state.friendship = 0.0
if "achievements" not in st.session_state:
    st.session_state.achievements = []
if "diaries" not in st.session_state:
    st.session_state.diaries = []
if "missions" not in st.session_state:
    st.session_state.missions = [
        {"title": "포근이 5번 쓰다듬기", "completed": False, "icon": "🐾", "target": 5, "current": 0},
        {"title": "포근이에게 간식 주기", "completed": False, "icon": "🍖"},
        {"title": "오늘의 일기 쓰기", "completed": False, "icon": "📔"}
    ]
if "pet_count" not in st.session_state:
    st.session_state.pet_count = 0

# 레벨 정보 계산
friendship_levels = [
    {"level": 1, "name": "처음 만난 사이", "icon": "🐣"},
    {"level": 2, "name": "어색한 친구", "icon": "🐾"},
    {"level": 3, "name": "친한 친구", "icon": "🌸"},
    {"level": 4, "name": "베스트 프렌드", "icon": "✨"},
    {"level": 5, "name": "세상의 단짝", "icon": "💎"},
    {"level": 6, "name": "영원한 동반자", "icon": "👑"},
    {"level": 10, "name": "전설의 유대", "icon": "🌈"},
    {"level": 12, "name": "포근이의 전부", "icon": "💖"}
]

current_level = int(st.session_state.friendship // 10) + 1
level_info = next((l for l in reversed(friendship_levels) if l["level"] <= current_level), friendship_levels[0])

# 공통 함수
def add_achievement(title, icon):
    if title not in st.session_state.achievements:
        st.session_state.achievements.append(title)
        st.toast(f"✨ 업적 달성! [{icon} {title}] ✨")
        st.balloons()

def complete_mission(title):
    for m in st.session_state.missions:
        if m["title"] == title and not m["completed"]:
            m["completed"] = True
            st.session_state.friendship += 5.0
            st.toast(f"📢 미션 완료! [{title}] 우정 점수 +5! ✨")
            return True
    return False

# 제미나이 설정
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# 사이드바 구성
with st.sidebar:
    st.markdown(f"<h2 style='color:#ff85a1;'>{level_info['icon']} {level_info['name']}</h2>", unsafe_allow_html=True)
    st.markdown(f"**💖 우정 점수:** {st.session_state.friendship:.1f} (Level {current_level})")
    
    # 설정 창
    with st.expander("⚙️ 프로필 설정"):
        new_nick = st.text_input("당신의 닉네임", value=st.session_state.nickname)
        if st.button("저장하기! ✨"):
            st.session_state.nickname = new_nick
            st.toast(f"{new_nick}님 반가워용! ✨")
    
    # 미션 영역
    st.markdown("### 🐾 오늘의 미션")
    for m in st.session_state.missions:
        status = "✅" if m["completed"] else "⭕"
        cls = "completed" if m["completed"] else ""
        st.markdown(f"<div class='mission-item {cls}'>{status} {m['icon']} {m['title']}</div>", unsafe_allow_html=True)

    st.divider()
    
    # 상호작용
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🐱 쓰다듬기"):
            st.session_state.pet_count += 1
            st.session_state.friendship += 0.5
            st.toast("냐앙~ 기분 좋아용! 🐾")
            if st.session_state.pet_count >= 5:
                complete_mission("포근이 5번 쓰다듬기")
    with col2:
        if st.button("🍖 간식 주기"):
            st.session_state.friendship += 1.5
            st.session_state.messages.append({"role": "assistant", "content": "냐미냐미! 너무 맛있어용! 😻 간식 고마워용! 💖🍖"})
            complete_mission("포근이에게 간식 주기")
            st.rerun()

    # 업적
    st.markdown("### ✨ 업적")
    if not st.session_state.achievements:
        st.caption("아직 달성한 업적이 없어용..")
    else:
        ach_html = "".join([f"<span class='achievement-tag'>{a}</span>" for a in st.session_state.achievements])
        st.markdown(ach_html, unsafe_allow_html=True)

    st.divider()
    
    if st.button("📔 일기 써달라고 하기"):
        if len(st.session_state.messages) < 4:
            st.warning("대화가 조금 더 필요해용! ✨")
        else:
            with st.spinner("포근이가 일기 쓰는 중... 🐾"):
                try:
                    summary = "\n".join([f"{m['role']}: {m['content']}" for m in st.session_state.messages[-10:]])
                    diary_model = genai.GenerativeModel('gemini-3-flash-preview', 
                        system_instruction="당신은 다정한 고양이 포근이입니다. 사용자와의 대화를 바탕으로 귀여운 일기를 작성해주세요. (이모지 듬뿍)")
                    response = diary_model.generate_content(f"오늘의 대화 요약:\n{summary}\n\n포근이의 시점에서 일기를 써줘!")
                    st.session_state.diaries.append({"date": datetime.now().strftime("%Y-%m-%d"), "content": response.text})
                    complete_mission("오늘의 일기 쓰기")
                    add_achievement("일기 쓰는 고양이", "📔")
                except:
                    st.error("일기 쓰다가 졸음이 쏟아졌어용.. 미안해용! 😿")

    if st.session_state.diaries:
        with st.expander("📖 일기장 보기"):
            for d in reversed(st.session_state.diaries):
                st.info(f"**[{d['date']}]**\n\n{d['content']}")

# 메인 화면
st.markdown("<h1 style='text-align: center; color: #ff85a1;'>✨ 포근이의 마법 대화 ✨</h1>", unsafe_allow_html=True)

# 채팅 기록 출력
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 사용자 입력
if prompt := st.chat_input(f"{st.session_state.nickname}, 포근이에게 말을 걸어봐용! ✨"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.session_state.friendship += 1.0
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        
        system_instruction = f"""당신은 가장 귀엽고 다정한 AI 친구 '포근이'입니다. 
        사용자의 닉네임은 '{st.session_state.nickname}'입니다.
        현재 우정 등급은 '{level_info['name']}'입니다.
        애교 섞인 말투(~해용!)와 풍부한 이모지(✨💖🐾🌈🍭)를 아주 듬뿍 사용하세요. 
        무조건적으로 사용자를 응원하고 사랑해주는 다정한 고양이입니다."""
        
        try:
            chat_model = genai.GenerativeModel(
                model_name='gemini-3-flash-preview',
                system_instruction=system_instruction
            )
            
            response = chat_model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    message_placeholder.markdown(full_response + " 🐾")
                    time.sleep(0.01)
            
            message_placeholder.markdown(full_response)
            st.session_state.messages.append({"role": "assistant", "content": full_response})
            
            # 업적 체크
            if len(st.session_state.messages) >= 10:
                add_achievement("수다쟁이", "🗣️")
            if st.session_state.friendship >= 40:
                add_achievement("베스트 프렌드", "✨")
                
            if "사랑해" in prompt or "귀여워" in prompt:
                st.balloons()
        except Exception as e:
            st.error("어머나! 마법 전송 중에 작은 문제가 생겼어용.. 😿")
