import streamlit as st
import google.generativeai as genai
import os
import base64

# 페이지 설정
st.set_page_config(page_title="포근이 챗봇 ✨", page_icon="💖", layout="centered")

# CSS로 귀엽게 꾸미기 (폰트 및 스타일)
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap');
    
    .main {
        background-color: #fff9fb;
    }
    .stApp {
        background: linear-gradient(135deg, #fff9fb 0%, #fff0f5 100%);
    }
    h1, h2, h3, p, span, div {
        font-family: 'Gaegu', cursive !important;
    }
    .stChatMessage {
        border-radius: 30px !important;
        padding: 20px !important;
        box-shadow: 0 10px 30px rgba(255,133,161,0.1) !important;
        border: 2px solid #fff !important;
    }
    .stChatFloatingInputContainer {
        bottom: 20px !important;
    }
    .stButton>button {
        border-radius: 20px !important;
        background: linear-gradient(to right, #ff85a1, #b79ced) !important;
        color: white !important;
        border: none !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 제미나이 설정
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    st.error("GEMINI_API_KEY가 설정되지 않았어요! ✨")
    st.stop()

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

st.markdown("# ✨ 포근이의 마법 대화 ✨")
st.markdown("### 세상에서 가장 귀엽고 똑똑한 AI 친구예용! 💕🍭")

# 채팅 기록 초기화
if "messages" not in st.session_state:
    st.session_state.messages = []

# 채팅 기록 표시
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 추천 질문
cols = st.columns(3)
suggestions = ["오늘 기분 어때? ✨", "칭찬해줘! 💖", "재미있는 얘기! 🍭"]
for i, suggestion in enumerate(suggestions):
    if cols[i % 3].button(suggestion):
        st.session_state.messages.append({"role": "user", "content": suggestion})
        # 트리거를 위해 리런
        st.rerun()

# 사용자 입력
if prompt := st.chat_input("포근이에게 반짝이는 마음을 전해봐용... 🐾"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("포근이가 마법을 부리는 중... ✨"):
            try:
                system_instruction = """당신은 세상에서 가장 귀엽고, 똑똑하며, 다정한 AI 친구 '포근이'입니다. 
                문장마다 귀여운 이모지를 3-4개씩 꼭 사용하고, '~해용!', '~했어용?' 처럼 애교 섞인 말투를 사용하세요.
                정확하고 유익한 정보를 포근이만의 귀여운 비유로 쉽게 설명해주세요. ✨🌈💖"""
                
                # 대화 기록 포함
                chat = model.start_chat(history=[
                    {"role": m["role"], "parts": [m["content"]]} for m in st.session_state.messages[:-1]
                ])
                response = chat.send_message(f"{system_instruction}\n\n사용자 질문: {prompt}")
                
                st.markdown(response.text)
                st.session_state.messages.append({"role": "assistant", "content": response.text})
                st.balloons() # 축하 효과!
            except Exception as e:
                st.error(f"어머나! 마법에 문제가 생겼어요: {e}")
