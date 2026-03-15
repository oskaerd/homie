#!/bin/sh
# Sets up the homie cron job for automated DB backups.
# Run this once on the RPi host after deploying with docker compose.
#
# Usage: ./scripts/install.sh
#
# To use a custom backup location, set BACKUP_DIR before running:
#   BACKUP_DIR=/mnt/nas/homie-backups ./scripts/install.sh
# The path must already exist. If unset or missing, defaults to ./backups next to the DB.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_DIR/.env"
CRON_JOB="*/30 * * * * docker exec homie node scripts/backup-db.js --keep 48"

# Resolve backup directory
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

# Write BACKUP_DIR to .env so docker compose picks it up for the bind-mount
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
