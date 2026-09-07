-- V124 advisor follow-up: cover the webhook ledger foreign key used for
-- reconciliation and cascade checks without exposing the private table.
create index if not exists gold_stripe_webhook_events_upgrade_request_v124_idx
  on private.gold_stripe_webhook_events(upgrade_request_id)
  where upgrade_request_id is not null;
