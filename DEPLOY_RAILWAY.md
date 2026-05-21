# Deploy en Railway

## Preparacion incluida

- `Procfile`: arranca Flask con Gunicorn.
- `railway.json`: define el start command para Railway.
- `requirements.txt`: incluye `gunicorn` y soporte PostgreSQL.
- La app lee `PORT`, `SECRET_KEY`, `DATABASE_URL`, `TML_ADMIN_EMAIL`, `TML_ADMIN_PASSWORD` y `TML_ADMIN_NAME`.

## Variables recomendadas

Configura estas variables en Railway:

```env
SECRET_KEY=usa-una-clave-larga-y-random
TML_ADMIN_EMAIL=admin@tuempresa.com
TML_ADMIN_PASSWORD=cambia-esta-clave
TML_ADMIN_NAME=Administrador
DEBUG=False
```

Si agregas PostgreSQL en Railway, Railway inyecta `DATABASE_URL` y la app lo usara automaticamente.

## Deploy

1. Sube este proyecto a GitHub.
2. En Railway, crea un proyecto y selecciona Deploy from GitHub repo.
3. Configura las variables de entorno.
4. Genera el dominio publico desde Networking.

Tambien puedes usar Railway CLI con `railway up` desde la carpeta del proyecto.
