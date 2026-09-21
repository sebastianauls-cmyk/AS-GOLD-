-- Immediate dispatch is backed by a durable once-per-minute recovery sweep.
-- It remains idle until the worker is deployed and its private config enabled.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;
select cron.schedule('ash-case-analysis-dispatch','* * * * *','select private.dispatch_case_analysis_jobs();');
