#!/bin/sh
# Sets up homie on the RPi: backup cron, HTTPS certs via Tailscale, and env config.
# Run this once after deploying with docker compose.
#
# Required env vars:
#   TAILSCALE_HOSTNAME   your MagicDNS hostname, e.g. raspberrypi.tail1234.ts.net
#
# Optional env vars:
#   BACKUP_DIR           host path for backups (default: ./backups next to docker-compose.yml)
#                        path must already exist if provided
#
# Example:
#   TAILSCALE_HOSTNAME=raspberrypi.tail1234.ts.net ./scripts/install.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_DIR/.env"

# ── Tailscale hostname ────────────────────────────────────────────────────────

if [ -z "$TAILSCALE_HOSTNAME" ]; then
  echo "Error: TAILSCALE_HOSTNAME is required."
  echo "Usage: TAILSCALE_HOSTNAME=raspberrypi.tail1234.ts.net ./scripts/install.sh"
  exit 1
fi

echo "Tailscale hostname: $TAILSCALE_HOSTNAME"

# Write TAILSCALE_HOSTNAME to .env
if grep -q "^TAILSCALE_HOSTNAME=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^TAILSCALE_HOSTNAME=.*|TAILSCALE_HOSTNAME=$TAILSCALE_HOSTNAME|" "$ENV_FILE"
else
  echo "TAILSCALE_HOSTNAME=$TAILSCALE_HOSTNAME" >> "$ENV_FILE"
fi

# ── TLS certificates ──────────────────────────────────────────────────────────

CERTS_DIR="$REPO_DIR/certs"
mkdir -p "$CERTS_DIR"

echo "Provisioning Tailscale certificate..."
sudo tailscale cert \
  --cert-file "$CERTS_DIR/$TAILSCALE_HOSTNAME.crt" \
  --key-file  "$CERTS_DIR/$TAILSCALE_HOSTNAME.key" \
  "$TAILSCALE_HOSTNAME"
echo "Certificate saved to $CERTS_DIR"

# Cron job to renew certs monthly and reload Caddy
CERT_CRON="0 0 1 * * sudo tailscale cert --cert-file $CERTS_DIR/$TAILSCALE_HOSTNAME.crt --key-file $CERTS_DIR/$TAILSCALE_HOSTNAME.key $TAILSCALE_HOSTNAME && docker compose -f $REPO_DIR/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile"

if crontab -l 2>/dev/null | grep -qF "tailscale cert"; then
  echo "Certificate renewal cron already installed, skipping."
else
  (crontab -l 2>/dev/null; echo "$CERT_CRON") | crontab -
  echo "Certificate renewal cron installed (runs monthly)."
fi

# ── Backup directory ──────────────────────────────────────────────────────────

if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
  echo "Using BACKUP_DIR: $BACKUP_DIR"
else
  if [ -n "$BACKUP_DIR" ]; then
    echo "Warning: BACKUP_DIR=$BACKUP_DIR does not exist, falling back to default."
  fi
  BACKUP_DIR="$REPO_DIR/backups"
  mkdir -p "$BACKUP_DIR"
  echo "Using default backup directory: $BACKUP_DIR"
fi

if grep -q "^BACKUP_DIR=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^BACKUP_DIR=.*|BACKUP_DIR=$BACKUP_DIR|" "$ENV_FILE"
else
  echo "BACKUP_DIR=$BACKUP_DIR" >> "$ENV_FILE"
fi

# ── Backup cron ───────────────────────────────────────────────────────────────

BACKUP_CRON="*/30 * * * * docker compose -f $REPO_DIR/docker-compose.yml exec homie node scripts/backup-db.js --keep 48"

if crontab -l 2>/dev/null | grep -qF "backup-db.js"; then
  echo "Backup cron already installed, skipping."
else
  (crontab -l 2>/dev/null; echo "$BACKUP_CRON") | crontab -
  echo "Backup cron installed (every 30 minutes, keeps last 48)."
fi

# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "Done. Start (or restart) the app:"
echo "  docker compose up -d"
echo ""
echo "Access at: https://$TAILSCALE_HOSTNAME"
