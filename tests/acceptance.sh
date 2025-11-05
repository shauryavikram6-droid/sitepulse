#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
EMAIL=${EMAIL:-engineer@demo.com}
PASSWORD=${PASSWORD:-sitepulse123}

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

curl -fsS -c "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

ORG_ID=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/auth/me" | python3 - <<'PY'
import json,sys
body=json.load(sys.stdin)
print(body['orgIds'][0])
PY
)

SITE_ID=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/me/sites" | python3 - <<'PY'
import json,sys
sites=json.load(sys.stdin)
print(sites[0]['id'])
PY
)

TRADE_ID=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/orgs/$ORG_ID/trades" | python3 - <<'PY'
import json,sys
trades=json.load(sys.stdin)
print(trades[0]['id'])
PY
)

curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/sites/$SITE_ID/attendance" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: acceptance-$(date +%s)" \
  -d "{\"entries\":[{\"date\":\"2024-01-10\",\"tradeId\":\"$TRADE_ID\",\"headcount\":2}]}" \
  | python3 - <<'PY'
import json,sys
entries=json.load(sys.stdin)
assert entries, 'attendance creation returned empty payload'
PY

curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/sites/$SITE_ID/wages/summary?week=2024-02" \
  | python3 - <<'PY'
import json,sys
summary=json.load(sys.stdin)
assert summary.get('weeklyTotal',0) >= 0, 'weekly summary missing total'
PY

PROMPT_ID=$(curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/sites/$SITE_ID/dpr/send" \
  -H "Content-Type: application/json" \
  -d '{"to":"919876543210"}' | python3 - <<'PY'
import json,sys
prompt=json.load(sys.stdin)
print(prompt['id'])
PY
)

curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/dpr/$PROMPT_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionKey":"progress_summary","answerText":"Work progressed"}' \
  | python3 - <<'PY'
import json,sys
answer=json.load(sys.stdin)
assert answer['promptId'], 'prompt id missing in DPR answer'
PY

DRAWING_ID=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/sites/$SITE_ID/drawings" | python3 - <<'PY'
import json,sys
drawings=json.load(sys.stdin)
print(drawings[0]['id'])
PY
)

curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/v1/drawings/$DRAWING_ID/diff/latest" \
  | python3 - <<'PY'
import json,sys
diff=json.load(sys.stdin)
assert diff, 'diff payload is empty'
PY

echo "Acceptance checks completed against $BASE_URL"
