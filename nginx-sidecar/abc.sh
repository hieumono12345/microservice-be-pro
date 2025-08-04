#!/bin/sh
apk add --no-cache curl jq coreutils

while true; do
  echo ">> Fetching config from Consul..."
  curl -k https://consul:8500/v1/kv/nginx.conf \
    | jq -r '.[0].Value' | base64 -d > /dynamic/nginx.conf

  cp /dynamic/nginx.conf /nginx/nginx.conf

  echo ">> Reloading NGINX..."
  docker exec nginx-waf openresty -s reload || true

  sleep 30
done
