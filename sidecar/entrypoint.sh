#!/bin/sh

apk add --no-cache curl jq coreutils docker-cli || exit 1

echo "🌐 Multi-service sidecar starting..."

echo "📁 Danh sách file trong /sidecar:"
ls -l /sidecar || echo "❌ Không thể đọc /sidecar"

echo "📄 Nội dung watchmap.json:"
cat /sidecar/watchmap.json || echo "❌ Không đọc được watchmap.json"

CONFIG_MAP="/sidecar/watchmap.json"

jq -c '.[]' "$CONFIG_MAP" | while read entry; do
  CONSUL_KEY=$(echo "$entry" | jq -r '.key')
  OUTPUT_PATH=$(echo "$entry" | jq -r '.output')
  RELOAD_CMD=$(echo "$entry" | jq -r '.reload')
  DEPENDENT_CMD=$(echo "$entry" | jq -r '.dependent_reload // empty')

  echo "🔄 Đang lấy key: $CONSUL_KEY"

  RAW_RESPONSE=$(curl -sk "https://localhost:8500/v1/kv/${CONSUL_KEY}")
  if [ -z "$RAW_RESPONSE" ]; then
    echo "❌ Không nhận được phản hồi từ Consul cho key: $CONSUL_KEY"
    continue
  fi

  ENCODED_VALUE=$(echo "$RAW_RESPONSE" | jq -r '.[0].Value')
  if [ "$ENCODED_VALUE" = "null" ] || [ -z "$ENCODED_VALUE" ]; then
    echo "❌ Không tìm thấy key trong JSON trả về: $CONSUL_KEY"
    continue
  fi

  VALUE=$(echo "$ENCODED_VALUE" | base64 -d 2>/dev/null)
  if [ -z "$VALUE" ]; then
    echo "❌ Lỗi khi giải mã base64 cho key: $CONSUL_KEY"
    continue
  fi

  mkdir -p "$(dirname "$OUTPUT_PATH")"
  echo "$VALUE" > "$OUTPUT_PATH"
  echo "✅ Ghi thành công vào: $OUTPUT_PATH"

  if [ -n "$RELOAD_CMD" ]; then
    echo "♻️ Thực thi reload: $RELOAD_CMD"
    sh -c "$RELOAD_CMD" || echo "⚠️ Không reload được: $RELOAD_CMD"
  fi

  if [ -n "$DEPENDENT_CMD" ]; then
    echo "♻️ Thực thi dependent reload: $DEPENDENT_CMD"
    sh -c "$DEPENDENT_CMD" || echo "⚠️ Không reload được: $DEPENDENT_CMD"
  fi
done

echo "✅ Sidecar hoàn tất khởi động. Bây giờ sẽ chuyển sang chế độ sleep..."
tail -f /dev/null
