from models_fixed import Menu

try:
    m = Menu()
    result = m.get_all_menu()
    print('Menu data retrieved successfully')
    print('First item:', result[0] if result else 'No data')
except Exception as e:
    print('Error:', e)
