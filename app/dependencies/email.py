# 라이브러리 불러오기
import os
import smtplib
import dotenv
import logging

dotenv.load_dotenv(".env.secret")  # .env.secret 파일에서 환경 변수 로드

# 개인 정보 입력(email, 앱 비밀번호)
my_email = os.getenv("EMAIL_HOST", "smtp.example.com")
password = os.getenv("EMAIL_PASSWORD", "your_email_password")
backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")  # 백엔드 URL 설정

def send_email(email: str, token: str):
    logger = logging.getLogger(__name__)
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as connection:
            connection.starttls() #Transport Layer Security : 메시지 암호화
            connection.login(user=my_email, password=password)
            connection.sendmail(
                from_addr=my_email, 
                to_addrs=email, 
                msg=f"Subject:Email Verification\n\nPlease click the link to verify your email: {backend_url}/auth/verify_email?token={token}"
            )
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")