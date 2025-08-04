#!/bin/sh

apk add --no-cache curl jq docker-cli coreutils

echo "🌐 Multi-service sidecar starting..."
CONFIG_MAP="/sidecar/watchmap.json"

jq -c '.[]' "$CONFIG_MAP" | while read entry; do
  KEY=$(echo "$entry" | jq -r '.key')
  OUTPUT=$(echo "$entry" | jq -r '.output')
  RELOAD=$(echo "$entry" | jq -r '.reload')
  DEPENDENT_RELOAD=$(echo "$entry" | jq -r '.dependent_reload // empty')

  mkdir -p $(dirname "$OUTPUT")

  (
    CURRENT_HASH=""
    while true; do
      BASE64=$(curl -sk "https://consul:8500/v1/kv/$KEY" | jq -r '.[0].Value')
      [ "$BASE64" = "null" ] && sleep 10 && continue

      echo "$BASE64" | base64 -d > "$OUTPUT.new"
      NEW_HASH=$(md5sum "$OUTPUT.new" | awk '{print $1}')
      if [ "$NEW_HASH" != "$CURRENT_HASH" ]; then
        echo "🔁 [$KEY] Config changed. Updating..."
        mv "$OUTPUT.new" "$OUTPUT"
        CURRENT_HASH="$NEW_HASH"

        if [ ! -z "$RELOAD" ]; then
          echo "🔄 Reload: $RELOAD"
          eval "$RELOAD"
        fi

        if [ ! -z "$DEPENDENT_RELOAD" ]; then
          echo "🔄 Also triggering dependent reload: $DEPENDENT_RELOAD"
          eval "$DEPENDENT_RELOAD"
        fi
      else
        rm -f "$OUTPUT.new"
      fi
      sleep 10
    done
  ) &
done

wait
