-- Tighten waitlist INSERT policy (avoid permissive WITH CHECK true)
drop policy if exists "Anyone can join waitlist" on public.waitlist_leads;

create policy "Anyone can join waitlist"
on public.waitlist_leads
for insert
with check (
  -- basic email shape validation (additional validation also happens in the backend function)
  email ~* '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
);
