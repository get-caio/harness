# Incident Response Skill

When production breaks, every minute costs money and trust. This skill defines how to respond systematically to minimize damage.

## Severity Levels

| Level     | Definition                                      | Response Time       | Examples                                                  |
| --------- | ----------------------------------------------- | ------------------- | --------------------------------------------------------- |
| **SEV-1** | Complete outage, data breach, security incident | Immediate (<15 min) | Site down, payment processing broken, user data exposed   |
| **SEV-2** | Major feature broken, significant user impact   | <1 hour             | Auth failing, core workflow broken, payment errors >5%    |
| **SEV-3** | Minor feature broken, workaround exists         | <4 hours            | Non-critical page broken, cosmetic issues, edge case bugs |
| **SEV-4** | Low impact, can wait                            | Next business day   | Typos, minor UI issues, performance slightly degraded     |

---

## Incident Response Procedure

### 1. DETECT (0-5 minutes)

**How incidents are discovered:**

- Monitoring alerts (Sentry, Vercel, custom)
- User reports
- Health check failures
- Error rate spikes

**First responder actions:**

```bash
# Check health immediately
curl -s https://your-app.vercel.app/api/health | jq

# Check recent deployments
vercel ls --prod

# Check error tracking
# Open Sentry dashboard
```

### 2. ASSESS (5-15 minutes)

**Determine severity:**

| Question                      | If Yes → |
| ----------------------------- | -------- |
| Is the site completely down?  | SEV-1    |
| Is user data at risk?         | SEV-1    |
| Is payment processing broken? | SEV-1    |
| Can users not log in?         | SEV-2    |
| Is a major feature broken?    | SEV-2    |
| Is there a workaround?        | SEV-3    |

**Gather context:**

```bash
# Recent commits
git log --oneline -10

# Recent deploys
vercel ls --prod

# Error logs
# Check Vercel → Logs → Filter by error

# Database status
# Check Supabase/provider dashboard
```

### 3. COMMUNICATE (Immediately after assessment)

**Internal notification template:**

```
🚨 INCIDENT: [Brief description]
Severity: SEV-[1/2/3]
Impact: [What's broken]
Status: Investigating
ETA: [If known]
Point person: [Name]
```

**For SEV-1/SEV-2:**

- Update status page (if exists)
- Notify stakeholders immediately
- Consider social media acknowledgment

### 4. MITIGATE (15-60 minutes)

**Decision tree:**

```
Is it a recent deploy?
├── YES → Can we rollback?
│   ├── YES → ROLLBACK (fastest)
│   └── NO → Why not?
│       ├── Database migration not reversible → Hotfix forward
│       └── Other reason → Document and hotfix
└── NO → What changed?
    ├── External dependency → Check provider status, implement fallback
    ├── Traffic spike → Scale up, enable rate limiting
    ├── Database issue → Check connections, indexes, query performance
    └── Unknown → Deep investigation
```

**Rollback procedure (Vercel):**

```bash
# List recent deployments
vercel ls --prod

# Identify last known good deployment
# In Vercel Dashboard: Deployments → Find stable version → Promote to Production

# OR via CLI
vercel rollback [deployment-url]
```

**Database rollback (if needed):**

```bash
# Check migration history
bunx prisma migrate status

# If migration is reversible
bunx prisma migrate resolve --rolled-back [migration-name]

# If not reversible, restore from backup
# Contact database provider or use point-in-time recovery
```

### 5. RESOLVE (Until fixed)

**Hotfix process (if rollback not possible):**

```bash
# Create hotfix branch
git checkout -b hotfix/incident-[date]-[description]

# Make minimal fix
# ONLY fix the immediate problem
# No refactoring, no "while we're here"

# Test locally
bun test
bun run build

# Deploy directly (skip normal PR process for SEV-1)
git push origin hotfix/incident-[date]-[description]

# Create expedited PR
gh pr create --title "🚨 HOTFIX: [description]" --body "SEV-1 incident fix. Details: [link to incident doc]"

# Get emergency approval and merge
```

### 6. VERIFY (After fix deployed)

```bash
# Confirm fix is live
curl -s https://your-app.vercel.app/api/health | jq

# Test the specific broken functionality
# [Run relevant manual tests]

# Monitor error rates for 15 minutes
# Check Sentry/Vercel for new errors
```

### 7. CLOSE & DOCUMENT (Within 24 hours)

**Update status:**

```
✅ RESOLVED: [Brief description]
Duration: [X hours Y minutes]
Impact: [What was affected]
Root cause: [Brief explanation]
Fix: [What was done]
```

**Post-incident document (for SEV-1/SEV-2):**

```markdown
# Incident Report: [Date] - [Title]

## Summary

- **Duration:** [Start time] - [End time] ([X hours Y minutes])
- **Severity:** SEV-[N]
- **Impact:** [Number of users affected, revenue impact if known]
- **Root cause:** [One sentence]

## Timeline

- [HH:MM] Incident detected via [source]
- [HH:MM] First responder acknowledged
- [HH:MM] Severity assessed as SEV-[N]
- [HH:MM] [Action taken]
- [HH:MM] Fix deployed
- [HH:MM] Verified resolved

## Root Cause Analysis

[Detailed explanation of what went wrong and why]

## What Went Well

- [List positive aspects of response]

## What Went Poorly

- [List areas for improvement]

## Action Items

- [ ] [Preventive measure 1] - Owner: [Name] - Due: [Date]
- [ ] [Preventive measure 2] - Owner: [Name] - Due: [Date]

## Lessons Learned

[What the team should remember for next time]
```

---

## Quick Reference Card

### SEV-1 Checklist

```
[ ] Health check status
[ ] Identify if recent deploy
[ ] Attempt rollback
[ ] Notify stakeholders
[ ] Update status page
[ ] Monitor continuously until resolved
[ ] Document within 24 hours
```

### Common Issues & Quick Fixes

| Symptom                    | Likely Cause               | Quick Fix                 |
| -------------------------- | -------------------------- | ------------------------- |
| 500 errors everywhere      | Bad deploy                 | Rollback                  |
| Database connection errors | Pool exhausted             | Restart, increase pool    |
| Slow responses (>5s)       | N+1 queries, missing index | Add index, optimize query |
| Auth not working           | Session/JWT issue          | Check env vars, restart   |
| Payment failing            | Stripe webhook issue       | Check Stripe dashboard    |
| Site partially down        | Single route broken        | Check specific route code |

### Emergency Contacts

| Service  | Dashboard            | Support              |
| -------- | -------------------- | -------------------- |
| Vercel   | vercel.com/dashboard | support@vercel.com   |
| Supabase | app.supabase.com     | support@supabase.com |
| Stripe   | dashboard.stripe.com | support@stripe.com   |
| Sentry   | sentry.io            | support@sentry.io    |

---

## Prevention

After every SEV-1/SEV-2, ask:

1. **Could we have detected this sooner?** → Add monitoring/alerting
2. **Could we have prevented this?** → Add tests, validation
3. **Could we have recovered faster?** → Improve runbooks, automation
4. **Did our process work?** → Update this document

---

## Never Do During Incident

- ❌ Make unrelated changes ("while we're here...")
- ❌ Deploy untested code
- ❌ Blame individuals
- ❌ Hide or minimize the incident
- ❌ Skip documentation
- ❌ Forget to update status page
- ❌ Go silent during long incidents
