# AvenBuild — Data Model and Proposed API Contract

**Status:** Phase 8 handoff · **Date:** 2026-10-24
The data model below is what the prototype implements today (`src/domain/types.ts`). The API is a **proposal** for the future backend: nothing in the prototype calls it. Endpoint shapes map one-to-one to existing domain commands, so the same rules (`src/domain`) can run on the server.

Conventions: money in **integer paise** (`BIGINT`); dates `YYYY-MM-DD`; timestamps ISO-8601 UTC; IDs are opaque prefixed strings (`prj_…`, `qt_…`). Every mutation accepts an `Idempotency-Key` header. Errors use one shape:

```json
{ "error": { "code": "INVALID_TRANSITION | NOT_FOUND | FORBIDDEN | VALIDATION | CONFLICT", "message": "…", "fieldErrors": { "lineItems.0.quantity": "…" } } }
```

HTTP mapping: `VALIDATION` → 422, `INVALID_TRANSITION` → 409, `CONFLICT` → 409, `FORBIDDEN` → 403, `NOT_FOUND` → 404. These codes are already returned by the domain commands (`src/domain/result.ts`).

## 1. Entities

| Entity | Key fields | Constraints / notes |
|---|---|---|
| **User** | id, role (`owner`\|`contractor`), displayName, city, locality | Exactly two roles; no admin. |
| **OwnerSettings** | userId, contactPreference, notificationPrefs{project,quote,message,milestone,change,review,system} | 1:1 with owner. |
| **ContractorProfile** | userId, businessName, contactName, bio, services[], serviceAreas[{city, localities[]}], yearsExperience, teamSize, availability{status, availableFrom}, typicalProjectRange{min,max paise}, contactPreferences, qualifications{licenceNumber, licenceStatus, gstNumber, gstStatus}, responseTimeSampleHours, visibility, quoteDefaults, notificationPrefs | `*Status ∈ sample_demo \| pending_demo \| not_submitted`; real verification replaces these. |
| **PortfolioItem** | id, contractorId, title, category, description, approxValue?, completedOn, city, images[AttachmentMeta] | |
| **Project** | id, ownerId, status, category, title, scope, scopeItems[], propertyType, location{city, locality, landmark}, budget (`range`\|`undisclosed`), startPreference, targetStartDate?, durationEstimate?, siteVisit{days[], window}, materialResponsibility, attachments[], accessNotes, publishedAt?, pausedFromStatus?, closedReason?, closedAt?, draftStep | Status machine in `architecture.md` §6.1. Category, city and budget are immutable after publish. |
| **LeadState** | contractorId, projectId, disposition (`saved`\|`ignored`) | PK (contractorId, projectId). |
| **QuoteInvitation** | ownerId, contractorId, projectId | PK (contractorId, projectId). |
| **ShortlistEntry** | ownerId, contractorId | PK (ownerId, contractorId). |
| **Quote** | id, projectId, contractorId, status, revision, content, pendingContent?, history[QuoteSnapshot], revisionRequest?, declineReason?, declineNote, submittedAt?, viewedAt?, decidedAt?, withdrawnAt? | UNIQUE(projectId, contractorId). Owners never see `draft` quotes or `pendingContent`. Expiry is derived from `content.validUntil`. |
| **QuoteContent** | lineItems[{id, description, quantity (≤2 dp), unit, ratePaise}], discount (`none`\|`percent`\|`flat`), taxPercent, startWindow{earliest, latest}, durationDays, proposedMilestones[{title, sharePercent}], inclusions[], exclusions[], assumptions[], validUntil, note | Totals are always computed (`src/domain/quotes/math.ts`), never accepted from clients. |
| **Workspace** | id, projectId, ownerId, contractorId, acceptedQuoteId, acceptedQuoteRevision, acceptedContent (frozen), agreement[AgreementVersion], status | UNIQUE(projectId). |
| **AgreementVersion** | revision, totalPaise, startDate, endDate, at, changeRequestId?, note | Append-only. |
| **Milestone** | id, workspaceId, order, title, description, targetDate, sharePercent, status, evidenceNote, changeRequestNote, startedAt?, submittedAt?, approvedAt? | Shares sum to 100. |
| **SiteUpdate** | id, workspaceId, authorId, date, notes, progressPercent, attachments[] | Contractor-authored. |
| **WorkspaceDocument** | id, workspaceId, addedBy, file (AttachmentMeta) | |
| **AttachmentMeta** | id, name, mimeType, sizeBytes, addedAt, previewKind | Backend adds storageKey and scanStatus. |
| **ChangeRequest** | id, workspaceId, proposedBy, kinds[], reason, scopeNote, newTotalPaise?, newEndDate?, status, responseNote, resolvedAt? | At most one `proposed` per workspace. |
| **ActivityEvent** | id, projectId, workspaceId?, type, actorId, at, summary | Append-only audit trail. |
| **Conversation** | id, projectId, ownerId, contractorId, kind (`enquiry`\|`project`), closedReason?, lastReadAt{userId → ts} | UNIQUE(projectId, contractorId). |
| **Message** | id, conversationId, senderId, body (1–2000 chars), sentAt | |
| **Notification** | id, recipientId, category, title, body, link, createdAt, readAt?, muted | Created only by domain events. |
| **Review** | id, contractorId, projectId, workspaceId, ownerId, reviewerLabel, projectTitle, rating 1–5, dimensions{communication, quality, scheduleClarity}, text | UNIQUE(projectId); only after completion. |

## 2. Proposed endpoints

Auth: `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/logout`, `GET /me`.

### Projects (owner)
| Method & path | Domain command | Notes |
|---|---|---|
| `POST /projects` | `createDraft` | Body: `ProjectDraftInput` + `draftStep`. |
| `PATCH /projects/:id` | `updateDraft` / `updatePublished` | Server picks by status; rejects immutable fields after publish (409). |
| `DELETE /projects/:id` | `deleteDraft` | Drafts only. |
| `POST /projects/:id/publish` | `publishProject` | 422 with fieldErrors if incomplete. |
| `POST /projects/:id/pause` · `/reopen` · `/close` · `/cancel` | `pauseProject` · `reopenProject` · `closeProject` · `cancelProject` | Cancel requires `reason`. |
| `POST /projects/:id/invitations` | `inviteToQuote` | Body `{ contractorId }`. |
| `GET /projects?mine=1&status=&q=` | `ownerProjects` selector | Paginated (`cursor`, `limit` ≤ 50). |
| `GET /projects/:id` | — | Owner sees everything; contractors see the lead view (no contact details). |
| `GET /projects/:id/quotes` | `ownerVisibleQuotes` | Excludes drafts and pendingContent. |

### Leads and quotes (contractor)
| Method & path | Domain command |
|---|---|
| `GET /leads?view=matched\|saved\|ignored&category=&city=&budget=&within=&sort=&q=` | `buildLeadRows` + `filterLeads` (returns `reasons[]`) |
| `PUT /leads/:projectId/disposition` `{ disposition: 'saved'\|'ignored'\|null }` | `setLeadDisposition` |
| `POST /projects/:id/quotes` | `startQuote` (returns the existing quote if one exists) |
| `PUT /quotes/:id/draft` `{ content }` | `saveQuoteDraft` |
| `POST /quotes/:id/submit` `{ content }` | `submitQuote` (first submit or resubmission) |
| `POST /quotes/:id/withdraw` | `withdrawQuote` |
| `DELETE /quotes/:id/draft` | `discardQuoteDraft` |
| `GET /pipeline` | `contractorPipeline` |

### Quote decisions (owner)
| Method & path | Domain command |
|---|---|
| `POST /quotes/:id/viewed` | `markQuoteViewed` (idempotent) |
| `POST /quotes/:id/revision-request` `{ message }` | `requestRevision` |
| `POST /quotes/:id/decline` `{ note? }` | `declineQuote` |
| `POST /quotes/:id/accept` | `acceptQuote` → `201 { workspaceId }`; transactional; 409 if a workspace already exists or the quote has expired |

### Workspace
| Method & path | Domain command |
|---|---|
| `GET /workspaces` · `GET /workspaces/:id` | selectors (participants only) |
| `POST /milestones/:id/{start\|submit\|approve\|request-changes\|resume}` `{ note? }` | `transitionMilestone` |
| `PATCH /milestones/:id` `{ title, description, targetDate }` | `editMilestone` |
| `POST /workspaces/:id/site-updates` | `postSiteUpdate` |
| `POST /workspaces/:id/documents` (after upload) · `DELETE /documents/:id` | `addDocuments` · `removeDocument` |
| `POST /workspaces/:id/change-requests` · `POST /change-requests/:id/{accept\|reject\|withdraw}` | `proposeChange` · `resolveChange` |
| `POST /workspaces/:id/complete` | `completeProject` |
| `POST /workspaces/:id/review` | `submitReview` |
| `GET /projects/:id/activity` | `projectActivity` |

### Uploads
`POST /uploads` `{ name, mimeType, sizeBytes, purpose }` → `{ uploadUrl, attachmentId }`; the client PUTs the file to `uploadUrl`; the server scans it and marks it ready.

### Messages and notifications
| Method & path | Domain command |
|---|---|
| `POST /projects/:id/conversations` `{ contractorId }` | `ensureConversation` |
| `GET /conversations` · `GET /conversations/:id/messages?before=` | `conversationsFor` · `conversationMessages` |
| `POST /conversations/:id/messages` `{ body }` | `sendMessage` |
| `POST /conversations/:id/read` | `markConversationRead` |
| `GET /notifications?unread=1&category=` · `POST /notifications/:id/read` · `POST /notifications/:id/unread` · `POST /notifications/read-all` | selectors · `setNotificationRead` · `markAllNotificationsRead` |
| `GET /events` (SSE/WebSocket) | pushes new messages and notifications |

### Profiles and discovery
| Method & path | Domain command |
|---|---|
| `GET /contractors?category=&city=&minRating=&minYears=&available=&portfolio=&sort=&q=` | `buildContractorRows` + `filterContractors` (listed profiles only) |
| `GET /contractors/:id` | profile + portfolio + reviews + computed aggregate |
| `PUT /me/contractor-profile` | `updateContractorProfile` (verification statuses are set by the server, never the client) |
| `PUT /me/owner-settings` | `updateOwnerSettings` |
| `POST /me/portfolio` · `PATCH /portfolio/:id` · `DELETE /portfolio/:id` | `savePortfolioItem` · `removePortfolioItem` |
| `PUT /me/shortlist/:contractorId` · `DELETE /me/shortlist/:contractorId` | `setShortlisted` |

## 3. Authorisation summary (server-enforced)

- Owners act only on their own projects, quote decisions, milestone approvals, completion and reviews.
- Contractors act only on their own quotes, lead states, milestones (start/submit/resume/edit), site updates and profile.
- Workspace, conversation and document access is limited to the two participants.
- Contractors can read a project only if it is published and they match, were invited, or have engaged with it. Drafts are never visible to contractors.
- Owner contact details are never returned to contractors.
