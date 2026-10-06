# SDO Romblon OneStop: System Design

## Product name

**SDO Romblon OneStop**

One portal for service requests, inquiries, follow-ups, document release, and internal routing across the Schools Division Office of Romblon.

## Design principle

Users choose the service they need, not the office they think they need. The system routes the request to the responsible unit and keeps one tracking number from beginning to completion.

## Public user experience

The homepage has three primary actions:

1. **Start a request or inquiry** — choose a service, complete the form, attach files, and receive a tracking number.
2. **Track my request** — sign in or enter the tracking number to view the timeline and reply when needed.
3. **My documents for pickup** — securely see documents marked ready by a unit and receive pickup instructions.

The service directory groups services by purpose rather than exposing internal organizational complexity. A user who is unsure may choose **Help me find the right service**, which goes to a controlled triage queue.

## Staff experience

Every unit has a protected dashboard using the same layout:

- New and unassigned requests
- Assigned to me
- Waiting for requester
- For internal endorsement
- For approval or signature
- Ready for release
- Completed and overdue

Unit heads can assign staff, transfer a request with an internal note, and view their unit's workload. A transfer preserves the request history and tracking number.

## Units and sample services

| Unit | Example services |
|---|---|
| ICT | DTR print request, account access, technical support, equipment concern |
| Budget | Budget availability and obligation inquiry |
| Accounting | Disbursement, liquidation, and payroll inquiry |
| Cashier | Check or payment release inquiry |
| Records | Document tracking, certified copies, incoming and outgoing records |
| Personnel | Leave, service record, and employment documents |
| Supply | Supply request, property, and equipment support |
| CID | Curriculum and learning-resource requests |
| SGOD | Learner support, training, governance, and monitoring requests |
| OSDS | Travel orders, memoranda, approvals, and executive signatures |
| Legal | Legal review, legal opinion, and document-related concerns |

## Common request lifecycle

`Draft → Submitted → Received → Under review → Assigned / Endorsed → Processing → Ready for release → Claimed or completed → Closed`

Not all services need every status. Each service gets a configured workflow and turnaround target.

## Restricted modules

Specialized modules live within the same platform but appear only to authorized roles.

- The ICT DTR module is available to authorized ICT DTR staff and to an employee for their own DTR only.
- Legal, Personnel, and sensitive Records services use stricter access rules.
- The system administrator manages accounts and configuration; routine access to confidential documents is not automatic.

## Design language

The portal should feel official, calm, and easy to understand:

- Navy blue and gold are the primary accents, reflecting the supplied identity marks.
- The public homepage is clean and task-led, with large plain-language actions.
- Forms show only the fields needed for the selected service.
- Status always uses words, dates, and next steps; color is never the only meaning.
- The site must work well on a phone because many requesters will use mobile data.

## Architecture summary

The platform has a web portal, Firebase Authentication, Cloud Firestore, secure server-side functions, a Google Workspace Shared Drive for files, notifications, and audit logs. Firestore stores request data and Drive file IDs; Google Drive stores the actual documents.

See `../firebase/architecture-notes.md` for implementation boundaries.
