# GateLab 1.0.0 — first release and Portainer updates

Source baseline: `GateLab-v1.9-Docker-ready.zip`. Application release: **1.0.0**.
Repository: https://github.com/shields10-CAL/gate-lab
Image: `ghcr.io/shields10-cal/gate-lab:latest`

## One-time initial setup

1. Extract this ZIP. Upload the **contents of the `GateLab` folder**, not the parent folder, to the root of the repository. Make sure `.github/workflows/docker.yml` is included.
2. Commit changes to the `main` branch.
3. Open GitHub → Actions. Confirm `Publish GateLab Docker Image` succeeded.
4. Go to GitHub Packages for this account and make the `gate-lab` container package **public**, or supply Portainer with registry credentials.
5. In Portainer, edit the existing GateLab stack. Replace its local image/build configuration using `portainer-stack.yml`, while retaining existing ports, networks, volumes and proxy settings where different.
6. In Portainer, update the stack with pulling images enabled. Verify the application and the `/healthz` endpoint.

## Everyday manual update

On your working copy:

```sh
git add .
git commit -m "Describe the GateLab change"
git push
```

Wait for the GitHub Actions publishing job to succeed. Then in Portainer, open the GateLab stack, and **Update the stack**, ensuring the latest image is pulled. This does not auto-deploy changes to students.

## Label this baseline as a versioned release

From a locally cloned Git repository after the first commit to `main`:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The version tag triggers publishing `ghcr.io/shields10-cal/gate-lab:1.0.0` for rollback. Leave that tag unchanged afterward. To roll back, pin the image to `:1.0.0` in Portainer and update the stack.

## Compatibility

The internal JSON document-format version and browser-autosave keys are intentionally unchanged. They should not be rewritten to 1.0.0.
