import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'backend'))
from backend.app import app
from backend.models import db, Usuario
from werkzeug.security import generate_password_hash

app.config['TESTING'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

with app.app_context():
    db.init_app(app)
    db.create_all()
    u = Usuario(nombre='Admin', email='admin@tml.local', password=generate_password_hash('admin123'), es_admin=True, rol='admin', activo=True)
    db.session.add(u)
    db.session.commit()

client = app.test_client()
r = client.get('/login?next=/dashboard')
print('GET', r.status_code, b'name="next" value="/dashboard"' in r.data)
r2 = client.post('/login?next=/dashboard', data={'email':'admin@tml.local', 'password':'admin123', 'next':'/dashboard'}, follow_redirects=False)
print('POST', r2.status_code, r2.headers.get('Location'))
if r2.headers.get('Location'):
    r3 = client.get(r2.headers.get('Location'), follow_redirects=False)
    print('FOLLOW', r3.status_code)
