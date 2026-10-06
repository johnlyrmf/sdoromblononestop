# Firebase and Google Drive Notes

## Recommended implementation

- Firebase Authentication for employees, requesters, and unit staff
- Cloud Firestore for units, services, requests, messages, status history, releases, and audit logs
- Cloud Functions or a private backend for all privileged actions
- An SDO-owned Google Workspace Shared Drive for PDFs and attachments

## Important boundary

Google Drive is document storage only. It is not the database and it must not expose public "anyone with the link" files.

The website sends a file to a protected backend endpoint. The backend verifies the signed-in user's role and unit access, uploads the file to the appropriate Shared Drive folder, and writes the Drive file ID and metadata to Firestore. Downloads go through the same authorization check.

## Suggested Firestore collections

```text
users
units
services
requests
requestEvents
documentReleases
notifications
auditLogs
dtrRecords
dtrPrintRequests
```

## Request access fields

Every request should contain at least:

```text
requesterId
currentUnitId
assignedToId
serviceId
status
trackingNumber
createdAt
dueAt
```

These fields enable secure unit queues and staff assignment. Firestore queries must request only records that the user is allowed to see; security rules do not filter a broad query after it has run.

## File metadata fields

```text
driveFileId
requestId
uploadedById
owningUnitId
classification
originalFileName
mimeType
uploadedAt
```

## Access rules to implement

- Requesters can read only their own requests and released documents.
- Unit staff can read and update requests currently assigned to their unit.
- Unit heads can assign staff within their unit.
- Transfers must add a permanent request event.
- DTR collections are limited to the employee and authorized ICT DTR roles.
- All sensitive reads, updates, uploads, releases, and claims create audit-log events.
