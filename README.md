# Taylor Scout Bible v11 — Shared Connected

This build uses the shared `.taylorscout.com` Supabase session and the show selected in the Hub.

It reads shared locations from `production_locations`, reads the shared Budget document, and saves the Bible document to `tool_documents` with `tool_key = bible`. It preserves a local-browser backup and subscribes to realtime updates.

Required Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BUDGET_URL=https://budget.taylorscout.com`
- `VITE_WAYPOINT_URL=https://waypoint.taylorscout.com`
