# Red Team Skill

Adversarial security testing for CAIO incubator projects. Assumes a running local instance. Complements the defensive `code-audit` skill with offensive testing to validate actual exploitability.

## Purpose

- **Validate** security controls actually work (not just exist)
- **Discover** vulnerabilities that static analysis misses
- **Test** from an attacker's perspective
- **Verify** OWASP Top 10 coverage systematically

## When to Run

| Trigger                          | Mode                      |
| -------------------------------- | ------------------------- |
| After Phase 1 (auth complete)    | Auth-focused              |
| After Phase 2 (core features)    | Full scan                 |
| Before shipping                  | Full scan + manual review |
| After security-sensitive changes | Targeted                  |

## Prerequisites

```bash
# Application must be running locally
bun dev  # or npm run dev

# Note the base URL (typically http://localhost:3000)
export TARGET_URL="http://localhost:3000"
```

---

## Phase 1: Reconnaissance

**Time: 5 min | Goal: Map the attack surface**

### 1.1 Endpoint Discovery

```bash
# Find all API routes
find . -path "*/api/*" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | \
  sed 's|.*app/api||' | sed 's|/route.ts||' | sed 's|\.ts||' | sort -u

# Find all page routes
find . -path "*/app/*" -name "page.tsx" -not -path "*/node_modules/*" 2>/dev/null | \
  sed 's|.*app||' | sed 's|/page.tsx||' | sort -u

# Find tRPC routers
grep -rn "router(" --include="*.ts" src/server/ 2>/dev/null | head -20
```

### 1.2 Authentication Surface

```bash
# Identify auth endpoints
curl -s "$TARGET_URL/api/auth/providers" 2>/dev/null | jq .

# Check for session endpoint
curl -s "$TARGET_URL/api/auth/session" 2>/dev/null | jq .

# List auth-related routes
grep -rn "signIn\|signOut\|register\|login\|password" --include="*.ts" --include="*.tsx" \
  --exclude-dir={node_modules,.next} . 2>/dev/null | \
  grep -E "route|action|api" | head -20
```

### 1.3 Input Points

```bash
# Find forms
grep -rn "<form" --include="*.tsx" --exclude-dir={node_modules,.next} . 2>/dev/null | wc -l

# Find file upload handlers
grep -rn "multipart\|formData\|upload" --include="*.ts" \
  --exclude-dir={node_modules,.next} . 2>/dev/null | head -10

# Find URL parameters in use
grep -rn "searchParams\|params\.\|query\." --include="*.ts" --include="*.tsx" \
  --exclude-dir={node_modules,.next} . 2>/dev/null | head -20
```

### Output

```
## Attack Surface Map
- API Endpoints: [N] found
- Page Routes: [N] found
- Auth Mechanism: [NextAuth/BetterAuth/Custom]
- Input Points: [N] forms, [N] file uploads, [N] URL params
- Session Type: [JWT/Cookie/etc]
```

---

## Phase 2: Authentication Testing

**Time: 15-20 min | Goal: Verify auth cannot be bypassed**

### 2.1 Unauthenticated Access

```bash
# Test protected API endpoints without auth
echo "=== Testing API endpoints without auth ==="

# Get list of API routes that should be protected
PROTECTED_ROUTES=$(grep -rln "getServerSession\|auth()\|requireAuth" \
  --include="*.ts" app/api/ 2>/dev/null | \
  sed 's|app/api||' | sed 's|/route.ts||')

for route in $PROTECTED_ROUTES; do
  echo "Testing: $TARGET_URL/api$route"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api$route")
  if [ "$STATUS" != "401" ] && [ "$STATUS" != "403" ]; then
    echo "⚠️ POTENTIAL ISSUE: $route returned $STATUS (expected 401/403)"
  fi
done
```

### 2.2 Session Manipulation

```bash
# Test with malformed session token
echo "=== Testing session manipulation ==="

# Expired token test
curl -s -H "Authorization: Bearer expired_token_12345" \
  "$TARGET_URL/api/user/profile" | head -5

# Empty token
curl -s -H "Authorization: Bearer " \
  "$TARGET_URL/api/user/profile" | head -5

# Malformed JWT (if JWT auth)
curl -s -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0." \
  "$TARGET_URL/api/user/profile" | head -5
```

### 2.3 Password Policy (if applicable)

```bash
# Test password requirements via registration/reset endpoints
echo "=== Testing password policy ==="

# Weak password test
curl -s -X POST "$TARGET_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123"}' | jq .

# Common password test
curl -s -X POST "$TARGET_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq .
```

### 2.4 Account Enumeration

```bash
# Test if login reveals user existence
echo "=== Testing account enumeration ==="

# Non-existent user
RESPONSE1=$(curl -s -X POST "$TARGET_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{"email":"definitely-not-real-user@test.com","password":"test"}')

# Existing user (if known)
RESPONSE2=$(curl -s -X POST "$TARGET_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrongpassword"}')

echo "Non-existent: $RESPONSE1"
echo "Existing: $RESPONSE2"
echo "⚠️ If responses differ, account enumeration possible"
```

### Flags

| Finding                                  | Severity    | Remediation                |
| ---------------------------------------- | ----------- | -------------------------- |
| Protected route returns 200 without auth | 🔴 Critical | Add auth middleware        |
| Accepts malformed tokens                 | 🔴 Critical | Validate token format      |
| No password complexity                   | ⚠️ Medium   | Enforce requirements       |
| Account enumeration possible             | ⚠️ Medium   | Use generic error messages |
| No rate limiting on login                | 🔴 High     | Add rate limiting          |

---

## Phase 3: Authorization Testing (IDOR)

**Time: 15-20 min | Goal: Verify users can't access others' data**

### 3.1 Direct Object Reference

```bash
# This requires valid auth tokens for two different users
# Replace USER1_TOKEN and USER2_TOKEN with actual session cookies/tokens

echo "=== Testing IDOR vulnerabilities ==="

# Get User 1's resources
USER1_RESOURCE_ID="<resource_id_belonging_to_user1>"

# Try to access User 1's resource as User 2
curl -s -H "Cookie: session=USER2_SESSION" \
  "$TARGET_URL/api/resources/$USER1_RESOURCE_ID" | jq .

# If returns data instead of 403, IDOR exists
```

### 3.2 ID Enumeration

```bash
# Test if sequential IDs leak data
echo "=== Testing ID enumeration ==="

# Try sequential/predictable IDs
for ID in 1 2 3 100 1000; do
  echo "Testing ID: $ID"
  curl -s -o /dev/null -w "ID $ID: %{http_code}\n" \
    "$TARGET_URL/api/resources/$ID"
done

# Test UUID guessing (should fail)
curl -s "$TARGET_URL/api/resources/00000000-0000-0000-0000-000000000001"
```

### 3.3 Horizontal Privilege Escalation

```bash
# Test modifying another user's data
echo "=== Testing horizontal privilege escalation ==="

# Try to update User 1's resource as User 2
curl -s -X PATCH \
  -H "Cookie: session=USER2_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"name":"hacked"}' \
  "$TARGET_URL/api/resources/$USER1_RESOURCE_ID"
```

### 3.4 Vertical Privilege Escalation

```bash
# Test accessing admin-only functions as regular user
echo "=== Testing vertical privilege escalation ==="

# Try admin endpoints
curl -s -H "Cookie: session=REGULAR_USER_SESSION" \
  "$TARGET_URL/api/admin/users" | head -10

curl -s -X POST \
  -H "Cookie: session=REGULAR_USER_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  "$TARGET_URL/api/user/update-role"
```

### Flags

| Finding                              | Severity    | Remediation                |
| ------------------------------------ | ----------- | -------------------------- |
| Can access other users' resources    | 🔴 Critical | Add ownership checks       |
| Sequential IDs reveal data count     | ⚠️ Low      | Use UUIDs                  |
| Can modify other users' data         | 🔴 Critical | Verify ownership on writes |
| Regular user can access admin routes | 🔴 Critical | Add role checks            |

---

## Phase 4: Injection Testing

**Time: 15-20 min | Goal: Test for injection vulnerabilities**

### 4.1 SQL Injection

```bash
# Test common SQL injection payloads
echo "=== Testing SQL injection ==="

SQLI_PAYLOADS=(
  "' OR '1'='1"
  "1; DROP TABLE users--"
  "' UNION SELECT * FROM users--"
  "1' AND '1'='1"
)

for payload in "${SQLI_PAYLOADS[@]}"; do
  echo "Testing: $payload"
  curl -s "$TARGET_URL/api/search?q=$(printf '%s' "$payload" | jq -sRr @uri)" | head -5
done
```

### 4.2 NoSQL Injection

```bash
# Test NoSQL injection (if MongoDB/similar)
echo "=== Testing NoSQL injection ==="

curl -s -X POST "$TARGET_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":{"$gt":""}}'

curl -s -X POST "$TARGET_URL/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query":{"$where":"sleep(5000)"}}'
```

### 4.3 XSS Testing

```bash
# Test reflected XSS
echo "=== Testing XSS ==="

XSS_PAYLOADS=(
  "<script>alert(1)</script>"
  "<img src=x onerror=alert(1)>"
  "javascript:alert(1)"
  "<svg onload=alert(1)>"
)

for payload in "${XSS_PAYLOADS[@]}"; do
  ENCODED=$(printf '%s' "$payload" | jq -sRr @uri)
  echo "Testing: $payload"
  RESPONSE=$(curl -s "$TARGET_URL/search?q=$ENCODED")
  if echo "$RESPONSE" | grep -q "$payload"; then
    echo "⚠️ POTENTIAL XSS: Payload reflected unescaped"
  fi
done
```

### 4.4 Command Injection

```bash
# Test command injection (if any shell interactions)
echo "=== Testing command injection ==="

CMD_PAYLOADS=(
  "; ls -la"
  "| cat /etc/passwd"
  "\`whoami\`"
  "\$(id)"
)

# Test in any parameter that might hit shell
for payload in "${CMD_PAYLOADS[@]}"; do
  ENCODED=$(printf '%s' "$payload" | jq -sRr @uri)
  curl -s "$TARGET_URL/api/process?file=test$ENCODED" | head -5
done
```

### Flags

| Finding                 | Severity    | Remediation                    |
| ----------------------- | ----------- | ------------------------------ |
| SQL error in response   | 🔴 Critical | Use parameterized queries      |
| NoSQL operator accepted | 🔴 Critical | Sanitize operators             |
| XSS payload reflected   | 🔴 Critical | Escape output, use CSP         |
| Command execution       | 🔴 Critical | Never pass user input to shell |

---

## Phase 5: API Security Testing

**Time: 10-15 min | Goal: Verify API hardening**

### 5.1 Rate Limiting Verification

```bash
# Actually test rate limiting works
echo "=== Testing rate limiting ==="

ENDPOINT="$TARGET_URL/api/auth/login"
LIMIT=20  # Adjust based on expected limit

echo "Sending $LIMIT rapid requests to $ENDPOINT"
for i in $(seq 1 $LIMIT); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    "$ENDPOINT")
  echo "Request $i: $STATUS"
  if [ "$STATUS" = "429" ]; then
    echo "✓ Rate limiting kicked in at request $i"
    break
  fi
done

if [ "$i" = "$LIMIT" ]; then
  echo "⚠️ Rate limiting may not be working - completed $LIMIT requests"
fi
```

### 5.2 CORS Verification

```bash
# Test actual CORS behavior
echo "=== Testing CORS ==="

# Test from different origin
curl -s -I -H "Origin: https://evil.com" "$TARGET_URL/api/user/profile" | \
  grep -i "access-control"

# Test preflight
curl -s -I -X OPTIONS \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  "$TARGET_URL/api/user/profile" | \
  grep -i "access-control"
```

### 5.3 Security Headers Verification

```bash
# Verify security headers are present
echo "=== Testing security headers ==="

HEADERS=$(curl -s -I "$TARGET_URL" | grep -iE "^(x-|content-security|strict-transport|referrer)")

echo "$HEADERS"

# Check for required headers
for header in "x-content-type-options" "x-frame-options" "strict-transport-security"; do
  if echo "$HEADERS" | grep -qi "$header"; then
    echo "✓ $header present"
  else
    echo "⚠️ $header MISSING"
  fi
done
```

### 5.4 Mass Assignment

```bash
# Test if API accepts unexpected fields
echo "=== Testing mass assignment ==="

curl -s -X POST "$TARGET_URL/api/user/update" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"admin","isVerified":true}' | jq .

# Check if role/admin fields were accepted
```

### Flags

| Finding                                 | Severity  | Remediation                  |
| --------------------------------------- | --------- | ---------------------------- |
| No rate limiting on sensitive endpoints | 🔴 High   | Add rate limiting middleware |
| CORS allows any origin                  | 🔴 High   | Restrict to known origins    |
| Missing security headers                | ⚠️ Medium | Add security headers         |
| Mass assignment accepted                | 🔴 High   | Whitelist allowed fields     |

---

## Phase 6: Business Logic Testing

**Time: 15-20 min | Goal: Test application-specific vulnerabilities**

### 6.1 Payment/Transaction Manipulation

```bash
# Test price manipulation (if applicable)
echo "=== Testing payment logic ==="

# Try negative quantities
curl -s -X POST "$TARGET_URL/api/cart/add" \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","quantity":-5}' | jq .

# Try zero price
curl -s -X POST "$TARGET_URL/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"123","price":0}]}' | jq .

# Try price override
curl -s -X POST "$TARGET_URL/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"123","price":0.01}]}' | jq .
```

### 6.2 Workflow Bypass

```bash
# Test skipping required steps
echo "=== Testing workflow bypass ==="

# Try to access step 3 without completing step 1 & 2
curl -s "$TARGET_URL/api/workflow/step3" | jq .

# Try to submit without verification
curl -s -X POST "$TARGET_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d '{"data":"test","verified":true}' | jq .
```

### 6.3 Race Conditions

```bash
# Test for race conditions in critical operations
echo "=== Testing race conditions ==="

# Send multiple concurrent requests
ENDPOINT="$TARGET_URL/api/redeem-coupon"
COUPON_CODE="SINGLE-USE-123"

for i in {1..5}; do
  curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"$COUPON_CODE\"}" &
done
wait

# Check if coupon was used multiple times
```

### Flags

| Finding                     | Severity    | Remediation                   |
| --------------------------- | ----------- | ----------------------------- |
| Negative values accepted    | 🔴 Critical | Validate business constraints |
| Can skip workflow steps     | 🔴 High     | Validate state server-side    |
| Price manipulation possible | 🔴 Critical | Calculate prices server-side  |
| Race condition exploitable  | 🔴 Critical | Add database locking          |

---

## Phase 7: Report Generation

### Security Test Report Template

```markdown
# Red Team Assessment: [Project Name]

Date: [timestamp]
Target: [URL]
Tester: [agent/human]
Application Running: [Yes/No]

## Executive Summary

| Category       | Status      | Critical | High | Medium | Low |
| -------------- | ----------- | -------- | ---- | ------ | --- |
| Authentication | [Pass/Fail] | [N]      | [N]  | [N]    | [N] |
| Authorization  | [Pass/Fail] | [N]      | [N]  | [N]    | [N] |
| Injection      | [Pass/Fail] | [N]      | [N]  | [N]    | [N] |
| API Security   | [Pass/Fail] | [N]      | [N]  | [N]    | [N] |
| Business Logic | [Pass/Fail] | [N]      | [N]  | [N]    | [N] |

**Overall Risk Level:** [Critical/High/Medium/Low]
**Recommendation:** [Block ship/Fix before ship/Ship with known issues]

## Critical Findings

| #   | Finding | Category | Endpoint   | Evidence | Remediation |
| --- | ------- | -------- | ---------- | -------- | ----------- |
| 1   | [title] | [cat]    | [endpoint] | [proof]  | [fix]       |

## High Findings

[table]

## Medium Findings

[table]

## Test Coverage

- [x] Unauthenticated access to protected endpoints
- [x] Session manipulation
- [x] IDOR testing
- [x] SQL injection
- [x] XSS
- [x] Rate limiting
- [x] CORS
- [x] Security headers
- [ ] [any skipped tests and why]

## Recommendations

1. [Priority fixes]
2. [Security improvements]
3. [Monitoring suggestions]
```

---

## Integration with Build Harness

### In CLAUDE.md Add

```yaml
# Available Skills section
| red-team | Adversarial security testing against running app |

# When to run
| After Phase 1 | Run /red-team auth (auth features complete) |
| After Phase 2 | Run /red-team full (core features complete) |
| Before ship | Run /red-team full + manual review |
```

### Command Registration

Create `.claude/commands/red-team.md`:

```markdown
---
name: red-team
description: Run adversarial security testing against the running application
---

# /red-team Command

## Usage

/red-team # Full scan
/red-team auth # Auth-focused testing only
/red-team api # API security only

## Prerequisites

- Application must be running locally
- Set TARGET_URL environment variable
```

---

## Comparison: audit vs red-team

| Aspect          | /audit                  | /red-team       |
| --------------- | ----------------------- | --------------- |
| Type            | Static analysis         | Dynamic testing |
| App state       | Not running             | Must be running |
| Perspective     | Defensive               | Offensive       |
| Finds           | Pattern violations      | Actual exploits |
| Speed           | Faster                  | Slower          |
| Coverage        | Code quality + security | Security only   |
| False positives | More                    | Fewer           |

**Use both.** Run `/audit` for fast pattern checks, `/red-team` to validate exploitability.

---

## Tool Alternatives

If curl-based testing is insufficient, consider:

| Tool         | Purpose                 | When to use          |
| ------------ | ----------------------- | -------------------- |
| `nuclei`     | Automated vuln scanning | Large attack surface |
| `ffuf`       | Fuzzing                 | Endpoint discovery   |
| `sqlmap`     | SQL injection           | Deep SQLi testing    |
| `httpx`      | HTTP probing            | Multiple targets     |
| `burp suite` | Interactive testing     | Manual deep-dive     |

For automated pipelines, consider integrating:

```bash
# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t $TARGET_URL
```

---

## Security Testing Ethics

This skill is for testing applications you own or have explicit permission to test. Never run these tests against production systems without proper authorization and safeguards.
