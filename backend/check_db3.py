import sys
sys.path.insert(0, '.')
from app import app

with app.test_client() as c:
    with c.session_transaction() as sess:
        sess['usuario_id'] = 1
        sess['rol'] = 'admin'
    res = c.get('/admin/analisis-avanzado')
    data = res.get_json()
    print('status', res.status_code)
    print('supervisores count', len(data['supervisores']))
    print('contratistas count', len(data['contratistas']))
    print('supervisores names', [item['nombre'] for item in data['supervisores']])
    print('supervisores rutas', [item['rutas'] for item in data['supervisores']])
    print('contratistas names', [item['nombre'] for item in data['contratistas']])
    print('contratistas rutas', [item['rutas'] for item in data['contratistas']])
