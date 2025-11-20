try:
    from routes import app
    print('App imported')
    from models_fixed import Menu
    m = Menu()
    data = m.get_all_menu()
    print('Data retrieved')
    if data:
        print('First item harga type:', type(data[0]['harga']))
        print('First item harga value:', data[0]['harga'])
    else:
        print('No data')
except Exception as e:
    print('Error:', e)
