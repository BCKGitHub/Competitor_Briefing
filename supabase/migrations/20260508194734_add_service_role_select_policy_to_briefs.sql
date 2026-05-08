/*
  # Add service-role SELECT policy for dashboard visibility

  1. Security Changes
    - Add a SELECT policy for the `service_role` role on `briefs` table
    - This allows the Supabase Dashboard Table Editor to display all rows
    - Does NOT affect anon/authenticated access (existing session-based policies remain)

  2. Notes
    - The service_role is used by the Supabase Dashboard and admin tools
    - Regular users still only see their own session's data via the existing anon policies
*/

CREATE POLICY "Service role can view all briefs"
  ON briefs
  FOR SELECT
  TO service_role
  USING (true);
