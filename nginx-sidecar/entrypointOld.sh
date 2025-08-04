#!/bin/sh

apk add --no-cache curl jq coreutils docker-cli

echo ">> Sidecar started. Watching nginx.conf in Consul..."

# Lưu checksum hiện tại để so sánh
CURRENT_HASH=""

while true; do
  echo "[nginx-sidecar] Fetching config from Consul..."
  RAW_BASE64=$(curl -sk https://consul:8500/v1/kv/nginx.conf | jq -r '.[0].Value')

  if [ "$RAW_BASE64" = "null" ] || [ -z "$RAW_BASE64" ]; then
    echo "[nginx-sidecar] nginx.conf key not found in Consul"
    sleep 10
    continue
  fi

  echo "$RAW_BASE64" | base64 -d > /dynamic/nginx.conf.new
  NEW_HASH=$(md5sum /dynamic/nginx.conf.new | awk '{print $1}')

  if [ "$NEW_HASH" != "$CURRENT_HASH" ]; then
    echo "[nginx-sidecar] Detected config change. Reloading NGINX..."
    mv /dynamic/nginx.conf.new /dynamic/nginx.conf
    cp /dynamic/nginx.conf /nginx-waf/nginx.conf

    docker kill -s HUP nginx-waf || true
    CURRENT_HASH="$NEW_HASH"
  else
    echo "[nginx-sidecar] No config change."
    rm -f /dynamic/nginx.conf.new
  fi

  sleep 10
done
