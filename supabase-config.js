/* =====================================================================
   Supabase config for the shared leaderboard.

   Fill these in to turn the leaderboard into a shared, cross-device board.
   Leave them blank to keep the leaderboard local to each device.

   Where to get them: Supabase dashboard → your project → Settings → API
     - url     = "Project URL"
     - anonKey = the "anon" / "public" API key
   The anon key is designed to be public (safe in client code); access is
   controlled by the table's Row Level Security policies.
   ===================================================================== */
window.SUPABASE_CONFIG = {
  url: "https://aqzaiyoiqcbcpfdfcygq.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemFpeW9pcWNiY3BmZGZjeWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjEyMTQsImV4cCI6MjA5NzE5NzIxNH0.0FZRWpYkEzkV7BThI82WzFjdUBfkxVME6bFW7JjyTS0",
};
