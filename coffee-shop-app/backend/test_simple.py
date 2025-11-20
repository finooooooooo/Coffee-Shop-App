import requests

try:
    r = requests.get('http://localhost:5000/api/menu')
    print('Status:', r.status_code)
    if r.status_code == 200:
        print('Success!')
    else:
        print('Error:', r.text[:300])
except Exception as e:
    print('Exception:', e)
