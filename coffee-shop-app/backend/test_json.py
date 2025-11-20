import json
from models_fixed import Menu

try:
    m = Menu()
    data = m.get_all_menu()
    print('Attempting JSON serialization...')
    json_str = json.dumps(data)
    print('Success!')
    print('JSON length:', len(json_str))
except Exception as e:
    print('Error:', e)
