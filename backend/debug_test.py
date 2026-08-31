import requests, json

BASE = 'http://localhost:8000'

# Guest auth
r = requests.post(f'{BASE}/api/auth/guest')
print('Guest auth status', r.status_code)
print(r.text)
if r.status_code != 200:
    exit(1)

data = r.json()
token = data['access_token']
headers = {'Authorization': f'Bearer {token}'}

# List conversations
r2 = requests.get(f'{BASE}/api/chat/conversations', headers=headers)
print('List conv status', r2.status_code)
print(r2.text)
