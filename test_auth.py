import requests
import sys

# 1. Login
response = requests.post("http://localhost:8000/auth/login", json={"email": "jdk829355@gmail.com", "password": "abc123"})
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    sys.exit(1)

token = response.json()["access_token"]
print(f"Token: {token}")

# 2. Get User Profile
headers = {"Authorization": f"Bearer {token}"}
resp = requests.get("http://localhost:8000/user/profile", headers=headers)
print(f"Profile Code: {resp.status_code}, Resp: {resp.text}")

# 3. Get Todo
resp = requests.get("http://localhost:8000/todo/my-tasks", headers=headers)
print(f"Todo Code: {resp.status_code}, Resp: {resp.text}")

# 4. Get Matching
resp = requests.get("http://localhost:8000/matching/my", headers=headers)
print(f"Matching Code: {resp.status_code}, Resp: {resp.text}")
