#!/bin/sh
set -e

echo "[ci_post_clone] Installing JS dependencies"
npm ci

echo "[ci_post_clone] Building web app"
npm run build

echo "[ci_post_clone] Syncing Capacitor iOS assets"
npx cap sync ios

echo "[ci_post_clone] Done"
