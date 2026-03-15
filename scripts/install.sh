#!/bin/sh
# Sets up the homie cron job for automated DB backups.
# Run this once on the RPi host after deploying with docker compose.
#
# Usage: ./scripts/install.sh

CRON_JOB="*/30 * * * * docker exec homie node scripts/backup-db.js --keep 48"

# Create the backups directory so Docker bind-mount doesn't create it as root
mkdir -p "$(dirname "$0")/../backups"

# Add cron entry only if it doesn't already exist
if crontab -l 2>/dev/null | grep -qF "backup-db.js"; then
  echo "Cron job already installed, skipping."
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "Cron job installed: $CRON_JOB"
fi
