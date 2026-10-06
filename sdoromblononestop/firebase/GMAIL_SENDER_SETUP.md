# Gmail sender setup for SDO OneStop

## Current no-cost workflow

The portal currently uses the Spark-plan-safe workflow: ICT enters the new
DepEd address and temporary password, then the portal opens a prepared Gmail
message addressed to the requester's verified recovery email. ICT sends the
message in Gmail and clicks **Save update** in the portal.

This workflow does not require Firebase Cloud Functions, Secret Manager, or a
billing account. The temporary password is not written to Firestore.

The Cloud Function setup below is retained only as an optional future upgrade.
Do not run it while the project remains on the Spark plan.

The activation-notice function sends mail through the temporary sender account
`johnlyrmf@gmail.com`. The OAuth client JSON and refresh token are secrets. Do
not put either one in `portal/`, Firestore, Git, or browser code.

## 1. Install function dependencies

From this `firebase/` directory:

```text
cd functions
npm install
```

## 2. Generate a refresh token

Install the dependencies, then run the one-time local authorization helper with
the downloaded Desktop OAuth client JSON:

```text
cd functions
npm install
node scripts/authorize-gmail.js "C:\path\to\downloaded-oauth-client.json"
```

A browser window will open. Choose `johnlyrmf@gmail.com` and approve only the
`gmail.send` permission. The helper saves the refresh token locally in
`functions/scripts/gmail-refresh-token.txt`; never paste it into chat or source
files.

## 3. Store secrets in Firebase Secret Manager

From the `firebase/` directory, set these secrets locally:

```text
firebase functions:secrets:set GMAIL_OAUTH_CLIENT_JSON --data-file path-to-oauth-client.json
firebase functions:secrets:set GMAIL_REFRESH_TOKEN
```

When prompted for `GMAIL_REFRESH_TOKEN`, paste the locally generated token.
Firebase deploys the secret to Secret Manager; it is not stored in Firestore.

## 4. Deploy the sender function

```text
firebase deploy --only functions:sendCredentialEmail
```

The function checks the authenticated ICT profile, sends the message, then
updates the request to `ready_for_activation` and adds a requester-visible
event. If Gmail rejects the send, the request status is not changed.

The temporary password is held in memory only for the send operation and is
never written to Firestore or logs.
