import streamlit as st
import google.generativeai as genai
import os

# 페이지 설정 (귀엽게!)
st.set_page_config(page_title="포근이 챗봇 ✨", page_icon="💖", layout="centered")

# CSS로 조금이라도 더 귀엽게 꾸미기
st.markdown("""
    <style>
    .main {
        background-color: #fff9fb;
    }
    .stChatMessage {
        border-radius: 20px;
        padding: 15px;
        margin-bottom: 10px;
    }
    h1 {
        color: #ff85a1;
        font-family: 'Gaegu', cursive;
        text-align: center;
    }
    </style>
    """, unsafe_allow_html=True)

# 제미나이 설정
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    st.error("GEMINI_API_KEY가 설정되지 않았어요! 설정에서 API 키를 입력해주세요. ✨")
    st.stop()

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

st.title("✨ 포근이 챗봇 ✨")
st.write("### 세상에서 가장 귀여운 AI 친구예요! 💕")

# 채팅 기록 초기화
if "messages" not in st.session_state:
    st.session_state.messages = []

# 채팅 기록 표시
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 사용자 입력
if prompt := st.chat_input("포근이에게 말을 걸어보세요! 🍭"):
    # 사용자 메시지 추가
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 포근이 답변 생성
    with st.chat_message("assistant"):
        with st.spinner("포근이가 생각 중이에요... ✨"):
            try:
                # 귀여운 페르소나 부여
                system_prompt = f"당신은 세상에서 가장 귀엽고 친절한 AI 친구 '포근이'입니다. 이모지를 아주 많이 사용하고 애교 섞인 말투로 답변하세요. 한국어로 답변하세요. 질문: {prompt}"
                response = model.generate_content(system_prompt)
                full_response = response.text
                st.markdown(full_response)
                st.session_state.messages.append({"role": "assistant", "content": full_response})
            except Exception as e:
                st.error(f"어머나! 마법에 문제가 생겼어요: {e}")
