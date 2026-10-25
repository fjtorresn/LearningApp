# LearningApp en una Raspberry Pi 4

La app corre en dos contenedores Docker (backend y frontend). El celular accede por Tailscale con HTTPS,
igual que con el PC, pero la Pi puede quedarse encendida 24/7 gastando muy poca electricidad.

## Requisitos

- Raspberry Pi 4 (2 GB o más) con **Raspberry Pi OS Lite de 64 bits** (usa *Raspberry Pi Imager* y activa SSH).
- Recomendado: arrancar desde un **SSD por USB** en lugar de la tarjeta SD (más rápido y no se corrompe).

## 1. Preparar la Pi

Conéctate por SSH (`ssh pi@<ip-de-la-pi>`) e instala Docker y Tailscale:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER        # cierra la sesión SSH y vuelve a entrar
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --operator=$USER   # inicia sesión con la misma cuenta que el celular
```

## 2. Copiar la app, las claves y tus datos

En la Pi:

```bash
git clone https://github.com/fjtorresn/LearningApp.git ~/LearningApp
mkdir -p ~/LearningApp/backend/data ~/LearningApp/dist
```

En el **PC** (desde la carpeta LearningApp), compila las imágenes para la Pi y cópialo todo:

```bash
./deploy/build-arm64.sh
scp dist/learningapp-arm64.tar.gz pi@<ip-de-la-pi>:~/LearningApp/dist/
scp backend/.env pi@<ip-de-la-pi>:~/LearningApp/backend/.env
scp frontend/.env.local pi@<ip-de-la-pi>:~/LearningApp/frontend/.env.local
scp backend/data/learningapp.db pi@<ip-de-la-pi>:~/LearningApp/backend/data/
```

> Para que la copia de la base de datos sea consistente, para antes el servicio del PC:
> `systemctl --user stop learningapp`.

## 3. Arrancar en la Pi

```bash
cd ~/LearningApp
tar -xzf dist/learningapp-arm64.tar.gz -C dist
docker load -i dist/backend-arm64.tar
docker load -i dist/frontend-arm64.tar
docker compose up -d
docker compose ps        # backend debe aparecer como "healthy"
```

Los contenedores tienen `restart: unless-stopped`: arrancan solos cada vez que se enciende la Pi.

> Alternativa sin el PC: `docker compose up -d --build` compila las imágenes en la propia Pi
> (tarda más y con 2 GB de RAM puede necesitar swap).

## 4. Publicarla con HTTPS y abrirla en el celular

```bash
tailscale serve --bg 3000
```

Muestra la nueva dirección (`https://<nombre-de-la-pi>.<tu-red>.ts.net`). Añádela al backend y reinícialo:

```bash
nano backend/.env    # CLERK_AUTHORIZED_PARTIES=...,https://<nombre-de-la-pi>.<tu-red>.ts.net
docker compose up -d --force-recreate backend
```

En el celular: abre la nueva dirección, inicia sesión e instala la app. Puedes desinstalar la versión del PC.

Cuando todo funcione, desactiva la app en el PC: `systemctl --user disable --now learningapp`.

## Actualizar la app

En el PC: `git pull` (o tus cambios), `./deploy/build-arm64.sh` y `scp` del archivo. En la Pi:

```bash
cd ~/LearningApp && git pull
tar -xzf dist/learningapp-arm64.tar.gz -C dist
docker load -i dist/backend-arm64.tar && docker load -i dist/frontend-arm64.tar
docker compose up -d     # recrea solo lo que cambió; las migraciones se aplican solas
```

## Copias de seguridad

Todas tus tarjetas están en `backend/data/learningapp.db`. Copia consistente aunque la app esté en marcha:

```bash
docker compose exec backend python -c "import sqlite3; sqlite3.connect('/data/learningapp.db').backup(sqlite3.connect('/data/backup.db'))"
scp pi@<ip-de-la-pi>:~/LearningApp/backend/data/backup.db ./learningapp-backup.db   # desde el PC
```
