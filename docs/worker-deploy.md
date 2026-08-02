# Deploying the worker

Nothing settles or pays without this. The worker runs verification, settlement,
payouts, market maintenance and the blockchain indexer. Until it is deployed a
contract's deadline passes and nothing happens.

## It is a SECOND Railway service, not a change to the web service

Do not edit the existing service. Its `railway.json` stays on
`npm run start:migrate`.

1. Railway → project → **New Service** → **GitHub Repo** → same repo/branch.
2. Set **Start Command** to `npm run worker`
   (or point the service's config path at `railway.worker.json`).
3. Give it the same environment variables as the web service — at minimum
   `DATABASE_URL`, `STRIPE_SECRET_KEY`, and whatever oracle keys are in use.
4. **No healthcheck path.** The worker serves no HTTP; a healthcheck will fail
   it forever.
5. Deploy.

## Confirming first boot

Expected in the logs, in order:

```
Worker starting
Starting job iteration
Verification job complete   ... processed: 0
Settlement job complete     ... processed: 0
Payout job complete         ... scanned: 0, sent: 0, blocked: 0, failed: 0
Market maintenance complete
Sleeping for 15000ms before next iteration
```

Zero rows everywhere is the correct first-boot result. The job must **no-op**,
not error, on an empty queue.

Then confirm it is not looping on a crash: the iteration counter should climb
across several sleeps rather than the process restarting.

## Scaling note

Run exactly ONE worker instance. The jobs take advisory locks per contract, but
payouts rely on the provider idempotency key to make a concurrent double-send a
no-op rather than a double payment. One instance keeps that as a backstop rather
than the primary defence.
