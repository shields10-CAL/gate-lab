# GateLab 1.0.0

![GateLab logo](public/assets/gatelab-wordmark.png)

**Current release: GateLab 1.0.0.** This is the first official release, baselined from the working GateLab v1.9 Docker-ready source.

GateLab is a classroom digital logic simulator for teaching Boolean gates, reusable integrated circuits, truth tables, and ripple-carry adders.

## Local development

```bash
npm install
npm run dev
```

Run the existing tests with `npm test` and create a production build with `npm run build`.

## Docker and Portainer

- `docker-compose.yml`: local build from source, image tag `gatelab:1.0.0`.
- `portainer-stack.yml`: Portainer deployment from `ghcr.io/shields10-cal/gate-lab:latest`.
- `.github/workflows/docker.yml`: GitHub Actions Docker publishing on pushes to `main` and version tags.
- `RELEASE.md`: first-time deployment and normal manual-update instructions.

## Browser projects

The application stores its project data in the browser and supports JSON imports and exports. Its document format has **not** been changed for this release.

See [CHANGELOG.md](CHANGELOG.md) for the earlier development history and [LICENSE](LICENSE) for licensing details.
