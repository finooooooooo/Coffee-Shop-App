from models_fixed import Menu

try:
    m = Menu()
    result = m.get_all_menu()
    if result:
        print('Type of first item:', type(result[0]))
        print('First item keys:', result[0].keys())
        print('Harga type:', type(result[0]['harga']))
        print('Harga value:', result[0]['harga'])
    else:
        print('No data')
except Exception as e:
    print('Error:', e)
