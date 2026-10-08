# SDO OneStop Firebase setup

The frontend Firebase integration is prepared, but it stays inactive until a Firebase Web App configuration is added.

## 1. Create and register the Firebase project

1. Create a Firebase project for SDO OneStop.
2. Register a Web App in the project settings.
3. Copy the Web App configuration into `portal/firebase-config.js`.

Only the public Web App configuration belongs in `portal/firebase-config.js`. Never place a Firebase service-account private key in this workspace.

## 2. Enable Authentication providers

Enable these providers for the prototype:

- Google
- Email/password
- Anonymous (used in the background to submit an ICT request; requesters do not see a sign-in prompt)

Add the local development host to Authentication > Settings > Authorized domains. Use a local web server instead of opening the HTML files directly with `file://`.

## 3. Create Firestore

Create a Cloud Firestore database, then publish `firebase/firestore.rules` and the indexes in `firebase/firestore.indexes.json`. The `firebase/` folder is the backend/deployment area; the `portal/` folder contains browser-facing UI files.

The rules allow:

- Request creation for the ICT Unit using the current Firebase session or an anonymous session created in the background
- Active ICT staff to read the ICT queue
- Requesters to read their own requests
- Anyone with a formatted 9-digit tracking code to read the limited tracking projection (service, requester name/email, status, and requester-visible updates); listing tracking records and reading request documents remain denied to the public
- Administrators to manage user profiles

## 4. Provision the first ICT staff account

The current prototype has one tightly restricted bootstrap account: `sdo@deped.gov.ph`. When that exact verified Google account signs in for the first time, the frontend creates its ICT administrator profile automatically. Other accounts are still rejected until ICT provisions them.

If you prefer manual provisioning later, create this Firestore document after the account exists in Firebase Authentication:

`users/{AUTH_USER_UID}`

```json
{
  "displayName": "ICT Test Account",
  "email": "staff@example.com",
  "unitId": "ICT Unit",
  "role": "unit_staff",
  "status": "active"
}
```

Google sign-in will be rejected if this approved profile does not exist. The browser never receives a password from ICT; Google or Firebase Authentication handles the identity check.

## 5. Test the ICT flow

1. Open `sign-in.html` through the local web server.
2. Sign in with the provisioned ICT account.
3. Confirm that `ict-dashboard.html` opens.
4. Submit an ICT request from `request-form.html?service=Request%20DTR`.
5. Confirm that the request appears in the ICT queue.
6. In the ICT queue, choose a status, add an optional message, and select **Save update**. The request document and a requester-visible timeline event are written together.
7. Open `track-request.html` on any device, enter the formatted code (for example, `SDO-123-456-789`), and select **View request**. The page reads only `public_tracking/{code}` and its `updates` subcollection, which contain the service, requester name/email, current status, and requester-visible updates. A requester reply is written directly to Firestore under rules that require the matching tracking code; no Cloud Function is called.

The 9-digit code is a bearer code: anyone who has it can view the service, requester name/email, status, and requester-visible updates, and can send a reply as the requester. Firestore rules allow exact document reads only and deny collection listing. Because lookup and replies go directly to Firestore without a server-side rate limiter, never add request details, attachments, or private events to this public projection.

The Google provider and modular web SDK pattern follow Firebase’s official web setup and Authentication guidance.

## 6. Provision staff accounts without Cloud Functions

Create the staff member in Firebase Authentication, then add the active profile document described above at `users/{AUTH_USER_UID}`. Send the staff member the normal Firebase password setup or reset email. The portal does not create accounts through Cloud Functions, so request submission and tracking do not require Cloud Functions or a Blaze plan.

**Unit request queues remain ICT-only in the current Firestore rules.** Other unit accounts can establish their identity, but they cannot open another unit's request queue until that unit is explicitly enabled in the rules and product UI.
