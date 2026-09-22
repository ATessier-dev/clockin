// Vercel's Node runtime defaults to UTC, but every "today"/"this week"
// boundary in the app (timesheets, schedule, dashboard) is meant to match
// the business's own calendar day — it's a single Montreal team, not a
// global product. Without this, `startOfDay`/`startOfWeek` computed
// server-side drift from what a Montreal-based browser considers "today",
// which is what caused the /timesheets "Today" button to point at
// yesterday. Setting TZ here, before any request is handled, makes the
// server's Date math agree with clients in the same timezone.
export async function register() {
  process.env.TZ = "America/Toronto";
}
