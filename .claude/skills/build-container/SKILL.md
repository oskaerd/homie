---
name: build-container
description: Used for building application container for RPi (32 or 64 bit)
---

To build the container for this application, you need to run either:
For 32-bit:
docker buildx build --platform linux/arm/v7 --load -t homie:arm32 .
docker save homie:arm32 -o homie-arm32.tar

or for 64-bit:
docker buildx build --platform linux/arm64 --load -t homie:arm64 .
docker save homie:arm64 -o homie-arm64.tar

