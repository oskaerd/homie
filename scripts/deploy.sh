#!/bin/sh
# Deploy homie to RPi over SSH.
#
# Usage: ./scripts/deploy.sh [user@host]
#
# Default target: oskar@homie

set -e

TARGET="${1:-oskar@homie}"
IMAGE="homie:latest"
TARBALL="/tmp/homie-arm64.tar"

echo "Building image for arm64..."
docker buildx build --platform linux/arm64 -t "$IMAGE" . --load

echo "Saving image..."
docker save "$IMAGE" -o "$TARBALL"

echo "Transferring to $TARGET..."
scp "$TARBALL" "$TARGET":~/homie-arm64.tar

echo "Loading image and restarting on $TARGET..."
ssh "$TARGET" "docker load < ~/homie-arm64.tar && cd ~/homie && docker compose up -d && rm ~/homie-arm64.tar"

rm "$TARBALL"

echo "Done. Deployed to $TARGET."
