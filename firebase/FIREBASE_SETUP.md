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
- Anonymous (used only to let a public requester submit an ICT request before an account is required)

Add the local development host to Authentication > Settings > Authorized domains. Use a local web server instead of opening the HTML files directly with `file://`.

## 3. Create Firestore

Create a Cloud Firestore database, then publish `firebase/firestore.rules` and the indexes in `firebase/firestore.indexes.json`. The `firebase/` folder is the backend/deployment area; the `portal/` folder contains browser-facing UI files.

The rules allow:

- Anonymous request creation for the ICT Unit only
- Active ICT staff to read the ICT queue
- Requesters to read their own requests
- Requesters to read only requester-visible progress events for their own requests
- Requesters to send a reply event only on their own request
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
7. In the same browser session that submitted the request, open `track-request.html`, enter its tracking number, and select **View request**. The current status and ICT timeline will load from Firestore.

The anonymous requester identity is intentionally retained in the browser that created the request. This keeps tracking private without exposing a public “anyone with a tracking number” query. Cross-device tracking can be added later with an email or one-time-code verification flow.

The Google provider and modular web SDK pattern follow Firebase’s official web setup and Authentication guidance.

## 6. Create staff accounts from the ICT dashboard

The ICT administrator can select **Create unit account** and enter a staff member’s name, official `@deped.gov.ph` email, and assigned office. The callable Cloud Function creates the Firebase Authentication user and active `unit_staff` profile, then emails a one-time password setup link. ICT never sees or stores the staff member’s password.

This uses the existing Gmail OAuth secrets configured for `sendCredentialEmail`. Make sure Email/Password is enabled in Firebase Authentication and both `GMAIL_OAUTH_CLIENT_JSON` and `GMAIL_REFRESH_TOKEN` are configured in Secret Manager. From the `firebase/` directory, deploy the new function with:

```sh
firebase deploy --only functions:createUnitStaffAccount
```

**Unit request queues remain ICT-only in the current Firestore rules.** A created Budget, Accounting, or other unit account can establish its identity, but it cannot yet open the matching request queue. Enabling each account to read and update requests and the timeline assigned to its unit requires an additional Firestore authorization change.
