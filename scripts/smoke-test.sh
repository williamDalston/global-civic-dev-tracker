#!/usr/bin/env bash
#
# Smoke test script for Civic Tracker production deployment.
# Validates that all critical endpoints respond correctly.
#
# Usage:
#   ./scripts/smoke-test.sh [BASE_URL]
#   Default BASE_URL: http://localhost:3000
#
# Exit codes:
#   0 = all checks pass
#   1 = one or more checks failed

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
WARN=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

check() {
  local label="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local body_contains="${4:-}"

  local response
  response=$(curl -s -o /tmp/smoke-body -w "%{http_code}" --max-time 15 "$url" 2>/dev/null) || {
    echo -e "${RED}FAIL${NC} $label — connection refused or timeout"
    FAIL=$((FAIL + 1))
    return
  }

  if [[ "$response" != "$expected_status" ]]; then
    echo -e "${RED}FAIL${NC} $label — expected HTTP $expected_status, got $response"
    FAIL=$((FAIL + 1))
    return
  fi

  if [[ -n "$body_contains" ]]; then
    if ! grep -q "$body_contains" /tmp/smoke-body 2>/dev/null; then
      echo -e "${YELLOW}WARN${NC} $label — HTTP $response OK but body missing '$body_contains'"
      WARN=$((WARN + 1))
      return
    fi
  fi

  echo -e "${GREEN}PASS${NC} $label — HTTP $response"
  PASS=$((PASS + 1))
}

check_json() {
  local label="$1"
  local url="$2"
  local expected_status="${3:-200}"

  local response
  response=$(curl -s -o /tmp/smoke-body -w "%{http_code}" --max-time 15 "$url" 2>/dev/null) || {
    echo -e "${RED}FAIL${NC} $label — connection refused or timeout"
    FAIL=$((FAIL + 1))
    return
  }

  if [[ "$response" != "$expected_status" ]]; then
    echo -e "${RED}FAIL${NC} $label — expected HTTP $expected_status, got $response"
    FAIL=$((FAIL + 1))
    return
  fi

  # Verify it's valid JSON
  if ! python3 -c "import json; json.load(open('/tmp/smoke-body'))" 2>/dev/null; then
    echo -e "${RED}FAIL${NC} $label — response is not valid JSON"
    FAIL=$((FAIL + 1))
    return
  fi

  echo -e "${GREEN}PASS${NC} $label — HTTP $response (valid JSON)"
  PASS=$((PASS + 1))
}

echo "========================================"
echo "  Civic Tracker Smoke Tests"
echo "  Target: $BASE_URL"
echo "  Time:   $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================"
echo ""

# ── Page rendering ──────────────────────────────────────────
echo "--- Page Rendering ---"
check "Homepage"                "$BASE_URL/"                           200 "Civic Tracker"
check "US country page"         "$BASE_URL/us"                         200
check "UK country page"         "$BASE_URL/uk"                         200
check "AU country page"         "$BASE_URL/au"                         200
check "CA country page"         "$BASE_URL/ca"                         200
check "DC city page"            "$BASE_URL/us/washington-dc"           200
check "NYC city page"           "$BASE_URL/us/new-york-city"           200
check "Chicago city page"       "$BASE_URL/us/chicago"                 200
check "London city page"        "$BASE_URL/uk/london"                  200
check "Sydney city page"        "$BASE_URL/au/sydney"                  200
check "Toronto city page"       "$BASE_URL/ca/toronto"                 200
check "Privacy page"            "$BASE_URL/privacy"                    200 "Privacy Policy"
check "Terms page"              "$BASE_URL/terms"                      200 "Terms of Service"
check "Admin login page"        "$BASE_URL/admin/login"                200
echo ""

# ── SEO infrastructure ─────────────────────────────────────
echo "--- SEO Infrastructure ---"
check      "robots.txt"         "$BASE_URL/robots.txt"                 200 "Sitemap"
check_json "Sitemap index"      "$BASE_URL/sitemap.xml"                200
echo ""

# ── API endpoints ───────────────────────────────────────────
echo "--- API Endpoints ---"
check "ETL trigger (no auth)"   "$BASE_URL/api/etl/trigger"            401
check "Admin leads (no auth)"   "$BASE_URL/api/admin/leads"            401

# Lead capture — POST with invalid data should return 400
LEAD_RESPONSE=$(curl -s -o /tmp/smoke-body -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad"}' \
  --max-time 10 \
  "$BASE_URL/api/leads/capture" 2>/dev/null) || LEAD_RESPONSE="000"

if [[ "$LEAD_RESPONSE" == "400" ]]; then
  echo -e "${GREEN}PASS${NC} Lead capture validation — HTTP 400 for invalid data"
  PASS=$((PASS + 1))
elif [[ "$LEAD_RESPONSE" == "429" ]]; then
  echo -e "${YELLOW}WARN${NC} Lead capture — rate limited (HTTP 429), validation not tested"
  WARN=$((WARN + 1))
else
  echo -e "${RED}FAIL${NC} Lead capture validation — expected 400, got $LEAD_RESPONSE"
  FAIL=$((FAIL + 1))
fi

# Lead capture — POST without consent should fail
CONSENT_RESPONSE=$(curl -s -o /tmp/smoke-body -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","citySlug":"washington-dc","consent":false}' \
  --max-time 10 \
  "$BASE_URL/api/leads/capture" 2>/dev/null) || CONSENT_RESPONSE="000"

if [[ "$CONSENT_RESPONSE" == "400" ]]; then
  echo -e "${GREEN}PASS${NC} Lead capture consent required — HTTP 400 without consent"
  PASS=$((PASS + 1))
elif [[ "$CONSENT_RESPONSE" == "429" ]]; then
  echo -e "${YELLOW}WARN${NC} Lead capture consent — rate limited (HTTP 429)"
  WARN=$((WARN + 1))
else
  echo -e "${RED}FAIL${NC} Lead capture consent — expected 400, got $CONSENT_RESPONSE"
  FAIL=$((FAIL + 1))
fi

# Method enforcement
METHOD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET --max-time 10 \
  "$BASE_URL/api/leads/capture" 2>/dev/null) || METHOD_RESPONSE="000"

if [[ "$METHOD_RESPONSE" == "405" ]]; then
  echo -e "${GREEN}PASS${NC} Lead capture method enforcement — HTTP 405 for GET"
  PASS=$((PASS + 1))
else
  echo -e "${RED}FAIL${NC} Lead capture method enforcement — expected 405, got $METHOD_RESPONSE"
  FAIL=$((FAIL + 1))
fi

echo ""

# ── Security ────────────────────────────────────────────────
echo "--- Security ---"
check "Admin dashboard (redirect)" "$BASE_URL/admin" 200  # Next.js redirect returns 200 with login page

# Check that admin API routes are protected
check "Admin ETL trigger (no auth)" "$BASE_URL/api/admin/etl/trigger" 401
echo ""

# ── Summary ─────────────────────────────────────────────────
echo "========================================"
echo -e "Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${YELLOW}${WARN} warnings${NC}"
echo "========================================"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
