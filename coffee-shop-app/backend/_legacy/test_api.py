import requests

try:
    r = requests.get('http://localhost:5000/api/menu')
    print('Backend response:', r.status_code)
    if r.status_code == 200:
        data = r.json()
        print('First 2 menu items:', data[:2])
    else:
        print('Error:', r.text)
except Exception as e:
    print(f'Request failed: {e}')
