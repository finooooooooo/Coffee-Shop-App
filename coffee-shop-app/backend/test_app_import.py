try:
    from routes import app
    print('App imported successfully')
except Exception as e:
    print('Import error:', e)
