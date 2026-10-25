#!/usr/bin/env bash
# Instala LearningApp como servicio de systemd (de usuario): arranca sola al encender el PC
# y se reinicia si falla. Uso: ./deploy/install-service.sh
#
#   Ver estado:   systemctl --user status learningapp
#   Ver logs:     journalctl --user -u learningapp -f
#   Reiniciar:    systemctl --user restart learningapp   (p. ej. tras cambiar el código)
#   Desinstalar:  systemctl --user disable --now learningapp && rm ~/.config/systemd/user/learningapp.service
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_DIR="$HOME/.config/systemd/user"
mkdir -p "$UNIT_DIR"

cat > "$UNIT_DIR/learningapp.service" <<EOF
[Unit]
Description=LearningApp (frontend Next.js + backend FastAPI)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$ROOT
# systemd no carga tu ~/.bashrc: le damos la ruta a uv y a la versión de Node por defecto de fnm.
Environment=PATH=$HOME/.local/bin:$HOME/.local/share/fnm/aliases/default/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$ROOT/start.sh
Restart=on-failure
RestartSec=5
# start.sh lanza dos procesos; al parar el servicio se detienen ambos.
KillMode=control-group

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now learningapp.service

# Sin "linger", los servicios de usuario solo arrancan cuando inicias sesión en el escritorio.
# Con linger arrancan al encender el PC, aunque no hayas iniciado sesión.
loginctl enable-linger "$USER" || echo "Aviso: no se pudo activar linger; la app arrancará al iniciar sesión."

systemctl --user --no-pager status learningapp.service | head -5
