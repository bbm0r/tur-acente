# 08 — CRM Module

Built-in CRM that unifies marketing-site visitors, leads, and customers into **one contact
record** with a sales pipeline, activities/tasks, segmentation, and campaigns. No external CRM.
The existing `customers` table **is** the contact (person); `lifecycleStage` tracks lead→customer.
Integrates with the booking engine (a won opportunity becomes a reservation) and the CMS
(a form submission becomes a lead).

## Schema additions (detail in prisma/schema.prisma)
- **`customers` enriched:** `lifecycleStage`, `ownerId` (sales agent), `leadSource`, tags.
- **`crm_pipelines` / `crm_stages`** — configurable kanban stages with win probability.
- **`crm_opportunities`** — a deal: contact + interest (destination/tour/dates/pax) + est. value + stage + owner; links to a reservation when won.
- **`crm_activities`** — calls / emails / WhatsApp / meetings / notes / **tasks** (due date + assignee + status).
- **`crm_tags` + `customer_tags`** — labeling.
- **`crm_segments` (+ static members)** — dynamic (saved filter) or static lists.
- **`email_campaigns` + recipients** — marketing sends with open/click tracking.
- **`custom_fields` + `custom_field_values`** — admin-defined fields on contacts/opportunities.

## Contact lifecycle
```
SUBSCRIBER → LEAD → OPPORTUNITY → CUSTOMER → REPEAT_CUSTOMER     (or → LOST)
```
Stage advances automatically: form/enquiry → LEAD; opportunity created → OPPORTUNITY;
reservation confirmed → CUSTOMER; 2nd booking → REPEAT_CUSTOMER.

## Sales pipeline (kanban)
Default pipeline: **Yeni → İletişim Kuruldu → Teklif Gönderildi → Pazarlık → Kazanıldı / Kaybedildi**
(each stage has a probability %). Opportunities are drag-dropped across stages. Each opportunity
optionally carries destination, tour, expected travel date, pax, and estimated value (for forecasting).
- **Won** → "Rezervasyona Dönüştür" creates a reservation pre-filled from the opportunity and links them.
- **Lost** → captured `lostReason` for reporting.

## Activities, tasks & follow-ups
Log any interaction (call/email/WhatsApp/meeting/note); create **tasks** with due date + assignee.
Overdue and today's tasks surface on the dashboard and as reminders. Every contact and opportunity
has a chronological **activity timeline**.

## Contact 360 view
One screen per contact: profile + custom fields + lifecycle + owner + tags · reservations · payments
& balance · documents · opportunities · full activity timeline · message threads · consent/KVKK status.
Duplicate detection (email/phone) with merge.

## Segmentation & campaigns
- **Segments:** dynamic (e.g. "Mısır ile ilgilenenler", "geçmiş yolcular", "bu ay doğum günü") or static lists.
- **Email/WhatsApp campaigns:** compose to a segment with merge fields + templates; schedule; track sent/open/click. WhatsApp uses the ready templates (doc references) until the API is live.

## Lead capture & attribution
Every entry point — contact form, "Acente beni arasın", WhatsApp CTA, newsletter, booking — records
**source** (channel + UTM + campaign). Inbound creates/updates a contact + a lead (+ optional
opportunity), auto-assigns an owner (round-robin among SALES_AGENT), and notifies them. CMS forms
(doc 09) feed straight in.

## Permissions (extends doc 02)
`crm:read`, `crm:write`, `crm:assign`, `marketing:send`. SALES_AGENT scoped to **own** contacts/
opportunities; SUPER_ADMIN + a "Sales Manager" role see all. Campaign sending gated to managers.
All mutations audited.

## Admin components
`PipelineBoard` (kanban), `ContactDetail` (360), `ActivityTimeline`, `TaskList` + `TaskComposer`,
`SegmentBuilder`, `EmailCampaignComposer`, `TagManager`, `LeadInbox`, `CustomFieldManager`,
`OpportunityForm`, `ConvertToReservationButton`.

## Dashboard widgets
My open tasks · overdue follow-ups · pipeline value by stage (forecast) · leads by source ·
lead→reservation conversion rate · new contacts this week · campaign performance.
