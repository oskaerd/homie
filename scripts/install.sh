#!/bin/sh
# Sets up the homie cron job for automated DB backups.
# Run this once on the RPi host after deploying with docker compose.
#
# Usage: ./scripts/install.sh [backup-dir]
#   backup-dir  host path for backup files (default: ./backups)
#
# Example: ./scripts/install.sh /mnt/nas/homie-backups

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_DIR/.env"
BACKUP_DIR="${1:-$REPO_DIR/backups}"
CRON_JOB="*/30 * * * * docker exec homie node scripts/backup-db.js --keep 48"

# Create the backup directory so Docker bind-mount doesn't create it as root
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"

# Write BACKUP_DIR to .env so docker compose picks it up
if grep -q "^BACKUP_DIR=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^BACKUP_DIR=.*|BACKUP_DIR=$BACKUP_DIR|" "$ENV_FILE"
  echo "Updated BACKUP_DIR in $ENV_FILE"
else
  echo "BACKUP_DIR=$BACKUP_DIR" >> "$ENV_FILE"
  echo "Added BACKUP_DIR to $ENV_FILE"
fi

# Add cron entry only if it doesn't already exist
if crontab -l 2>/dev/null | grep -qF "backup-db.js"; then
  echo "Cron job already installed, skipping."
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "Cron job installed: $CRON_JOB"
fi

echo ""
echo "Done. Restart the container for the new backup path to take effect:"
echo "  docker compose up -d"
