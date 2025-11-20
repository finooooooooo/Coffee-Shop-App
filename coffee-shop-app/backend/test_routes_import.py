try:
    from routes import app
    print('routes imported')
    from models_fixed import Menu
    m = Menu()
    data = m.get_all_menu()
    print('Data type:', type(data))
    if data:
        print('First item type:', type(data[0]))
        print('Harga type:', type(data[0]['harga']))
    else:
        print('No data')
except Exception as e:
    print('Error:', e)
