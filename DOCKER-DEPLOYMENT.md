# GateLab 1.0.0 — Docker deployment

**Recommended for classroom server:** use the image published from GitHub Container Registry, and update manually through Portainer. See `RELEASE.md`.

## Run from published image (Portainer)

Use `portainer-stack.yml` as the stack definition. It pulls `ghcr.io/shields10-cal/gate-lab:latest`, exposing host port 8088 to container port 80. Preserve any different port, network, proxy or volume settings from your existing stack.

## Local builds (optional)

```sh
docker compose up -d --build
```

The local Compose file builds from the source directory and tags the result `gatelab:1.0.0`.

## Health endpoint

`http://YOUR_SERVER_IP:8088/healthz`
