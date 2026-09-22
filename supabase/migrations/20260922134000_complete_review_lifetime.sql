-- The measured three-candidate review exhausted 45 minutes before completion.
-- New jobs receive one fixed hour; existing rows and their expiry are untouched.
-- Stage, claim, correction and transport retry budgets are unchanged.
alter table public.case_analysis_jobs alter column expires_at set default now()+interval '60 minutes';
