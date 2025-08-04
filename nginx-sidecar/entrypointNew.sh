#!/bin/sh

apk add --no-cache curl jq coreutils docker-cli

echo ">> Sidecar started. Watching nginx.conf in Consul..."

CONFIG_MAP="/sidecar/watchmapNew.json"

jq -c '.[]' "$CONFIG_MAP" | while read entry; do
  CONSUL_KEY=$(echo "$entry" | jq -r '.key')
  OUTPUT_PATH=$(echo "$entry" | jq -r '.output')
  RELOAD_CMD=$(echo "$entry" | jq -r '.reload')
  DEPENDENT_CMD=$(echo "$entry" | jq -r '.dependent_reload // empty')

  RAW_RESPONSE=$(curl -sk "https://localhost:8500/v1/kv/${CONSUL_KEY}")
  if [ -z "$RAW_RESPONSE" ]; then
    echo "❌ Không nhận được phản hồi từ Consul cho key: $CONSUL_KEY"
    sleep 20
    continue
  fi

  ENCODED_VALUE=$(echo "$RAW_RESPONSE" | jq -r '.[0].Value')
  if [ "$ENCODED_VALUE" = "null" ] || [ -z "$ENCODED_VALUE" ]; then
    echo "❌ Không tìm thấy key trong JSON trả về: $CONSUL_KEY"
    sleep 20
    continue
  fi

  VALUE=$(echo "$ENCODED_VALUE" | base64 -d 2>/dev/null)
  if [ -z "$VALUE" ]; then
    echo "❌ Lỗi khi giải mã base64 cho key: $CONSUL_KEY"
    sleep 20
    continue
  fi

  # Tính hash mới
  NEW_HASH=$(echo "$VALUE" | sha256sum | awk '{print $1}')

  # Nếu file output tồn tại, tính hash cũ
  if [ -f "$OUTPUT_PATH" ]; then
    OLD_HASH=$(sha256sum "$OUTPUT_PATH" | awk '{print $1}')
  else
    OLD_HASH="null"
  fi

  # So sánh hash
  if [ "$OLD_HASH" == "$NEW_HASH" ]; then
    echo "⏸️  Không thay đổi gì ở key: $CONSUL_KEY"
    sleep 20
    continue
  fi

  echo "✅ Nội dung thay đổi, cập nhật file: $OUTPUT_PATH"
  echo "$VALUE" > "$OUTPUT_PATH"

  if [ -n "$DEPENDENT_CMD" ]; then
    echo "🔁 Chạy dependent reload: $DEPENDENT_CMD"
    sh -c "$DEPENDENT_CMD"
  fi

  echo "🔄 Chạy reload: $RELOAD_CMD"
  sh -c "$RELOAD_CMD"
  sleep 20
  echo "✅ Hoàn tất cập nhật cho key: $CONSUL_KEY"
  echo "-----------------------------------"
done
