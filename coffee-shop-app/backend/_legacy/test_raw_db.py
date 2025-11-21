from database import Database

try:
    db = Database()
    result = db.execute_query('SELECT * FROM Menu LIMIT 1')
    print('Raw result:', result)
    if result:
        print('Type:', type(result[0]))
        print('Harga type:', type(result[0]['harga']))
        print('Harga value:', result[0]['harga'])
    else:
        print('No data')
except Exception as e:
    print('Error:', e)
