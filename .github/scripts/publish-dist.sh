#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${PUBLISH_BRANCH:?PUBLISH_BRANCH is required}"
: "${PUBLISH_MESSAGE:?PUBLISH_MESSAGE is required}"

if [[ ! -f dist/index.html ]]; then
  echo "dist/index.html was not found; refusing to publish an incomplete build." >&2
  exit 1
fi

publish_dir="$(mktemp -d)"
cp -a dist/. "${publish_dir}/"

git -C "${publish_dir}" init
git -C "${publish_dir}" checkout -b "${PUBLISH_BRANCH}"
git -C "${publish_dir}" config user.name "github-actions[bot]"
git -C "${publish_dir}" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "${publish_dir}" add --all
git -C "${publish_dir}" commit --message "${PUBLISH_MESSAGE}"

remote_url="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
git -C "${publish_dir}" push --force "${remote_url}" "HEAD:${PUBLISH_BRANCH}"
