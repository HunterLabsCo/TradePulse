#!/bin/bash
# One-shot: init git, connect to remote, commit all changes, push to main
cd "$(dirname "$0")"

echo "==> Initializing git..."
git init

echo "==> Adding remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/HunterLabsCo/TradePulse.git

echo "==> Fetching remote history..."
git fetch origin main

echo "==> Syncing with remote (keeps your local files)..."
git reset origin/main

echo "==> Staging all changes..."
git add -A

echo "==> Committing..."
git commit -m "feat(redesign): Mist complete - all pages including Landing, Sentry wired"

echo "==> Pushing to main..."
git push origin HEAD:main

echo ""
echo "Done! Check tradepulseapp.io in ~2 min after Vercel builds."
