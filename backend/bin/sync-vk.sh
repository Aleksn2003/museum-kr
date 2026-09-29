#!/bin/sh
set -eu
if [ -n "${VK_SYNC_KEY:-}" ] && [ -n "${VK_ACCESS_TOKEN:-}" ]; then
  curl --fail --silent --show-error --max-time 120 -H "X-Sync-Key: ${VK_SYNC_KEY}" http://localhost/api/sync/vk >/dev/null
fi
