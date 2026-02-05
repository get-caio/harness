# Debug Skill

Before investigating any bug:

1. Identify the exact error message and where it occurs
2. Check if the API endpoint is correct and not deprecated
3. Verify authentication is passing (check for 401/403)
4. Check if required IDs from previous API calls are being stored
5. Search git history for working implementations: `git log -p --all -S 'functionName'`

Only after completing this checklist, propose a fix.
