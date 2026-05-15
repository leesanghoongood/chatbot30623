import streamlit as st
import google.generativeai as genai
import os
import time

# 페이지 설정
st.set_page_config(page_title="포근이 챗봇 ✨", page_icon="💖", layout="wide")

# CSS로 귀엽게 꾸미기
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap');
    
    .stApp {
        background: linear-gradient(135deg, #fff9fb 0%, #f0f9ff 100%);
    }
    .main .block-container {
        padding-top: 2rem;
    }
    h1 {
        text-shadow: 2px 2px 0px white;
    }
    .stChatMessage {
        border-radius: 30px !important;
        padding: 20px !important;
        margin-bottom: 15px !important;
        border: 4px solid #fff !important;
        box-shadow: 0 10px 20px rgba(255, 133, 161, 0.05) !important;
    }
    .stChatMessage[data-testimonial="user"] {
        background-color: rgba(123, 223, 242, 0.1) !important;
    }
    .stChatInputContainer {
        border: none !important;
        padding: 1rem !important;
    }
    .stChatInput {
        border: 4px solid white !important;
        border-radius: 40px !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
    }
    .stButton>button {
        width: 100%;
        border-radius: 25px !important;
        background: white !important;
        color: #ff85a1 !important;
        border: 2px solid #ff85a1 !important;
        font-weight: bold !important;
        transition: all 0.3s !important;
    }
    .stButton>button:hover {
        background: #ff85a1 !important;
        color: white !important;
    }
    .main .block-container {
        max-width: 800px !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 제미나이 설정
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

if "nickname" not in st.session_state:
    st.session_state.nickname = "친구님"
if "messages" not in st.session_state:
    st.session_state.messages = []
if "friendship" not in st.session_state:
    st.session_state.friendship = 0

with st.sidebar:
    st.markdown("## 🐾 포근이의 설정")
    new_nick = st.text_input("당신의 닉네임", value=st.session_state.nickname)
    if st.button("저장하기! ✨"):
        st.session_state.nickname = new_nick
        st.toast(f"{new_nick}님 반가워용! ✨")
    
    st.divider()
    st.markdown(f"**💖 우정 점수:** {st.session_state.friendship:.1f}")
    if st.button("🍖 간식 주기 (+1.5)"):
        st.session_state.friendship += 1.5
        st.balloons()
        st.toast("냐미냐미! 너무 맛있어용! 😻")
        st.session_state.messages.append({"role": "assistant", "content": f"간식 너무 고마워용, {st.session_state.nickname}! 💖🍖"})

st.markdown("<h1 style='text-align: center; color: #ff85a1;'>✨ 포근이의 마법 대화 ✨</h1>", unsafe_allow_html=True)

# 채팅 기록
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 사용자 입력
if prompt := st.chat_input(f"{st.session_state.nickname}, 포근이에게 말을 걸어봐용! ✨"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        
        system_instruction = f"""당신은 가장 귀엽고 다정한 AI 친구 '포근이'입니다. 
        사용자의 닉네임은 '{st.session_state.nickname}'입니다.
        애교 섞인 말투(~해용!)와 풍부한 이모지(✨💖🐾)를 사용하세요. 🍭🌈"""
        
        try:
            # 시스템 인스트럭션을 생성 시점에 주입하여 더 일관된 성격 유지
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
            if "사랑해" in prompt or "귀여워" in prompt:
                st.balloons()
        except Exception as e:
            st.error("어머나! 마법 전송 중에 작은 문제가 생겼어용.. 😿")
