import "server-only";
import { db } from "./db";
import { sendEmail, emailLayout } from "./email";

/** Staff users available as owners/assignees. */
export function listStaff() {
  return db.user.findMany({
    where: { realm: "STAFF", isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }],
  });
}

/** Leads for the inbox (all statuses, newest first) with their assignee + form origin. */
export function listLeads(take = 60) {
  return db.lead.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      destination: { select: { nameTr: true } },
      tour: { select: { titleTr: true } },
      submissions: { take: 1, orderBy: { createdAt: "desc" }, include: { form: { select: { name: true } } } },
    },
  });
}

export function getPipelineBoard() {
  return db.crmPipeline.findFirst({
    where: { isDefault: true },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: {
          opportunities: {
            orderBy: { createdAt: "desc" },
            include: {
              customer: { select: { id: true, firstName: true, lastName: true } },
              destination: { select: { nameTr: true } },
              owner: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
}

export function listCustomersLite() {
  return db.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
}

export function getOpportunity(id: string) {
  return db.crmOpportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
      stage: { select: { id: true, name: true, isWon: true, isLost: true } },
      destination: { select: { nameTr: true } },
      tour: { select: { titleTr: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { firstName: true, lastName: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
      },
    },
  });
}

/** Move an opportunity to a stage; a won/lost stage also closes it. */
export async function moveOpportunity(id: string, stageId: string) {
  const stage = await db.crmStage.findUnique({ where: { id: stageId } });
  if (!stage) throw new Error("STAGE_NOT_FOUND");
  const status = stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN";
  await db.crmOpportunity.update({
    where: { id },
    data: { stageId, status, closedAt: stage.isWon || stage.isLost ? new Date() : null },
  });
}

export async function createOpportunity(
  input: { title: string; customerId: string; ownerId?: string; estValueMinor?: number; expectedTravelDate?: Date; destinationSlug?: string; adults?: number; children?: number },
  actorId: string,
) {
  const pipeline = await db.crmPipeline.findFirst({ where: { isDefault: true }, include: { stages: { orderBy: { sortOrder: "asc" }, take: 1 } } });
  if (!pipeline || pipeline.stages.length === 0) throw new Error("NO_PIPELINE");
  let destinationId: string | undefined;
  if (input.destinationSlug) {
    const d = await db.destination.findUnique({ where: { slug: input.destinationSlug }, select: { id: true } });
    destinationId = d?.id;
  }
  return db.crmOpportunity.create({
    data: {
      title: input.title, customerId: input.customerId, ownerId: input.ownerId ?? actorId,
      pipelineId: pipeline.id, stageId: pipeline.stages[0].id, status: "OPEN", source: "ADMIN",
      estValueMinor: input.estValueMinor, expectedTravelDate: input.expectedTravelDate, destinationId,
      adults: input.adults, children: input.children,
    },
  });
}

export async function logActivity(
  input: { type: string; subject: string; body?: string; opportunityId?: string; customerId?: string; dueAt?: Date },
  actorId: string,
) {
  return db.crmActivity.create({
    data: {
      type: input.type as never, status: input.dueAt ? "PENDING" : "DONE",
      subject: input.subject, body: input.body,
      opportunityId: input.opportunityId, customerId: input.customerId,
      dueAt: input.dueAt, completedAt: input.dueAt ? undefined : new Date(),
      assignedToId: actorId, createdById: actorId,
    },
  });
}

export type CustomerFilter = { q?: string; lifecycle?: string; ownerId?: string };

/** Contacts list with search (name/email/phone) + lifecycle/owner filters. */
export function listCustomers(f: CustomerFilter = {}) {
  const q = f.q?.trim();
  return db.customer.findMany({
    where: {
      deletedAt: null,
      ...(f.lifecycle ? { lifecycleStage: f.lifecycle as never } : {}),
      ...(f.ownerId ? { ownerId: f.ownerId } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      owner: { select: { firstName: true, lastName: true } },
      tags: { include: { tag: true } },
      _count: { select: { reservations: true, opportunities: true } },
    },
  });
}

/** Full 360° profile: profile + reservations + opportunities + activities + messages + favorites + tags. */
export function getCustomerProfile(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      tags: { include: { tag: true } },
      reservations: {
        orderBy: { createdAt: "desc" },
        include: { tour: { select: { titleTr: true } }, tourDate: { select: { startDate: true, endDate: true } } },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        include: { stage: { select: { name: true } }, destination: { select: { nameTr: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
      favorites: { include: { tour: { select: { titleTr: true, slug: true } } } },
    },
  });
}

export function listTags() {
  return db.crmTag.findMany({ orderBy: { name: "asc" } });
}

/** Open (PENDING) activities/tasks across the CRM, optionally only those assigned to a user. */
export function listTasks(opts: { assignedToId?: string } = {}) {
  return db.crmActivity.findMany({
    where: { status: "PENDING", ...(opts.assignedToId ? { assignedToId: opts.assignedToId } : {}) },
    orderBy: { dueAt: { sort: "asc", nulls: "last" } },
    take: 300,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      opportunity: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function createTask(
  input: { subject: string; body?: string; type?: string; dueAt?: Date; assignedToId?: string; customerId?: string; opportunityId?: string },
  actorId: string,
) {
  return db.crmActivity.create({
    data: {
      type: (input.type ?? "TASK") as never,
      status: "PENDING",
      subject: input.subject,
      body: input.body,
      dueAt: input.dueAt,
      customerId: input.customerId,
      opportunityId: input.opportunityId,
      assignedToId: input.assignedToId ?? actorId,
      createdById: actorId,
    },
  });
}

// ── Dashboard / reporting ─────────────────────────────────────────────
export async function getCrmDashboard() {
  const now = new Date();
  const [oppByStatus, oppByStage, leadsByStatus, custByLifecycle, openTasks, overdueTasks, oppByOwner, stages, staff, customerCount] = await Promise.all([
    db.crmOpportunity.groupBy({ by: ["status"], _count: { _all: true }, _sum: { estValueMinor: true } }),
    db.crmOpportunity.groupBy({ by: ["stageId"], where: { status: "OPEN" }, _count: { _all: true }, _sum: { estValueMinor: true } }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.customer.groupBy({ by: ["lifecycleStage"], where: { deletedAt: null }, _count: { _all: true } }),
    db.crmActivity.count({ where: { status: "PENDING" } }),
    db.crmActivity.count({ where: { status: "PENDING", dueAt: { lt: now } } }),
    db.crmOpportunity.groupBy({ by: ["ownerId", "status"], _count: { _all: true }, _sum: { estValueMinor: true } }),
    db.crmStage.findMany({ where: { pipeline: { isDefault: true } }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { realm: "STAFF" }, select: { id: true, firstName: true, lastName: true } }),
    db.customer.count({ where: { deletedAt: null } }),
  ]);

  const byStatus = (s: string) => oppByStatus.find((r) => r.status === s);
  const openCount = byStatus("OPEN")?._count._all ?? 0;
  const openValue = byStatus("OPEN")?._sum.estValueMinor ?? 0;
  const wonCount = byStatus("WON")?._count._all ?? 0;
  const wonValue = byStatus("WON")?._sum.estValueMinor ?? 0;
  const lostCount = byStatus("LOST")?._count._all ?? 0;
  const closed = wonCount + lostCount;
  const winRate = closed ? Math.round((wonCount / closed) * 100) : 0;

  const stageBreakdown = stages.map((s) => {
    const g = oppByStage.find((r) => r.stageId === s.id);
    return { name: s.name, count: g?._count._all ?? 0, value: g?._sum.estValueMinor ?? 0 };
  });

  const agentMap = new Map<string, { open: number; won: number; wonValue: number }>();
  for (const r of oppByOwner) {
    const id = r.ownerId ?? "none";
    const a = agentMap.get(id) ?? { open: 0, won: 0, wonValue: 0 };
    if (r.status === "OPEN") a.open += r._count._all;
    if (r.status === "WON") { a.won += r._count._all; a.wonValue += r._sum.estValueMinor ?? 0; }
    agentMap.set(id, a);
  }
  const agents = [...agentMap.entries()]
    .map(([id, a]) => ({ name: id === "none" ? "Atanmamış" : (() => { const s = staff.find((u) => u.id === id); return s ? `${s.firstName} ${s.lastName}` : "—"; })(), ...a }))
    .sort((x, y) => y.wonValue - x.wonValue || y.open - x.open);

  const leadsTotal = leadsByStatus.reduce((a, r) => a + r._count._all, 0);

  return {
    openCount, openValue, wonCount, wonValue, lostCount, winRate,
    customerCount, openTasks, overdueTasks, leadsTotal,
    stages: stageBreakdown,
    leadsByStatus: leadsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    lifecycle: custByLifecycle.map((r) => ({ stage: r.lifecycleStage, count: r._count._all })),
    agents,
  };
}

// ── Segments & Campaigns ──────────────────────────────────────────────
export type SegmentFilter = { lifecycle?: string; tagId?: string; consentOnly?: boolean };

function segmentWhere(filter: SegmentFilter) {
  return {
    deletedAt: null,
    NOT: { email: "" },
    ...(filter.consentOnly ? { marketingConsent: true } : {}),
    ...(filter.lifecycle ? { lifecycleStage: filter.lifecycle as never } : {}),
    ...(filter.tagId ? { tags: { some: { tagId: filter.tagId } } } : {}),
  };
}

export function resolveSegmentCustomers(filter: SegmentFilter) {
  return db.customer.findMany({ where: segmentWhere(filter), select: { id: true, firstName: true, lastName: true, email: true } });
}
export function countSegmentCustomers(filter: SegmentFilter) {
  return db.customer.count({ where: segmentWhere(filter) });
}

export async function listSegments() {
  const segs = await db.crmSegment.findMany({ orderBy: { createdAt: "desc" } });
  return Promise.all(segs.map(async (s) => ({ id: s.id, name: s.name, filter: (s.filterJson as SegmentFilter) ?? {}, memberCount: await countSegmentCustomers((s.filterJson as SegmentFilter) ?? {}) })));
}

export function createSegment(input: { name: string; filter: SegmentFilter }, actorId: string) {
  return db.crmSegment.create({ data: { name: input.name, type: "DYNAMIC", filterJson: input.filter as never, createdById: actorId } });
}

export function listCampaigns() {
  return db.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { segment: { select: { name: true } }, _count: { select: { recipients: true } } },
  });
}
export function getCampaign(id: string) {
  return db.emailCampaign.findUnique({
    where: { id },
    include: {
      segment: true,
      recipients: { orderBy: { sentAt: "desc" }, include: { customer: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });
}
export function createCampaign(input: { name: string }, actorId: string) {
  return db.emailCampaign.create({ data: { name: input.name, subject: "", body: "", status: "DRAFT", createdById: actorId } });
}

/** Resolve the campaign's segment → email each (marketing-consented) member, recording recipients + stats. */
export async function sendCampaign(campaignId: string) {
  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId }, include: { segment: true } });
  if (!campaign) throw new Error("NOT_FOUND");
  if (campaign.status === "SENT" || campaign.status === "SENDING") throw new Error("ALREADY_SENT");
  if (!campaign.subject.trim() || !campaign.body.trim()) throw new Error("EMPTY");
  if (!campaign.segmentId || !campaign.segment) throw new Error("NO_SEGMENT");

  const filter = (campaign.segment.filterJson as SegmentFilter) ?? { consentOnly: true };
  const customers = await resolveSegmentCustomers(filter);
  await db.emailCampaign.update({ where: { id: campaignId }, data: { status: "SENDING" } });

  const html = emailLayout(campaign.subject, campaign.body.includes("<") ? campaign.body : `<p>${campaign.body.replace(/\n/g, "<br/>")}</p>`);
  let sent = 0, failed = 0;
  for (const c of customers) {
    if (!c.email) continue;
    const res = await sendEmail({ to: c.email, subject: campaign.subject, html });
    if (res.ok) sent++; else failed++;
    await db.emailCampaignRecipient.upsert({
      where: { campaignId_customerId: { campaignId, customerId: c.id } },
      create: { campaignId, customerId: c.id, status: res.ok ? "SENT" : "FAILED", sentAt: res.ok ? new Date() : null },
      update: { status: res.ok ? "SENT" : "FAILED", sentAt: res.ok ? new Date() : null },
    });
  }
  await db.emailCampaign.update({ where: { id: campaignId }, data: { status: "SENT", sentAt: new Date(), stats: { sent, failed, total: customers.length } as never } });
  return { sent, failed, total: customers.length };
}

/**
 * Convert a lead into a sales opportunity:
 * find-or-create the Customer (by email), create an OPEN opportunity in the
 * default pipeline's first stage, log an initial note, and mark the lead CONVERTED.
 */
export async function convertLeadToOpportunity(leadId: string, actorId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const pipeline = await db.crmPipeline.findFirst({
    where: { isDefault: true },
    include: { stages: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (!pipeline || pipeline.stages.length === 0) throw new Error("NO_PIPELINE");
  const firstStage = pipeline.stages[0];
  const ownerId = lead.assignedToId ?? actorId;

  let customer = await db.customer.findFirst({ where: { email: lead.email } });
  if (!customer) {
    const parts = lead.name.trim().split(/\s+/);
    const firstName = parts.shift() || lead.name;
    customer = await db.customer.create({
      data: {
        firstName,
        lastName: parts.join(" ") || "—",
        email: lead.email,
        phone: lead.phone,
        source: lead.channel,
        leadSource: lead.channel,
        lifecycleStage: "OPPORTUNITY",
        ownerId,
      },
    });
  } else if (customer.lifecycleStage === "LEAD" || customer.lifecycleStage === "SUBSCRIBER") {
    await db.customer.update({ where: { id: customer.id }, data: { lifecycleStage: "OPPORTUNITY" } });
  }

  const opp = await db.crmOpportunity.create({
    data: {
      title: `${lead.name} — ${lead.destinationId ? "destinasyon talebi" : "talep"}`,
      customerId: customer.id,
      ownerId,
      pipelineId: pipeline.id,
      stageId: firstStage.id,
      destinationId: lead.destinationId ?? undefined,
      tourId: lead.tourId ?? undefined,
      status: "OPEN",
      source: lead.channel,
    },
  });

  await db.crmActivity.create({
    data: {
      type: "NOTE",
      status: "DONE",
      subject: "Talepten oluşturuldu",
      body: lead.message ?? undefined,
      customerId: customer.id,
      opportunityId: opp.id,
      assignedToId: ownerId,
      createdById: actorId,
      completedAt: new Date(),
    },
  });

  await db.lead.update({ where: { id: leadId }, data: { status: "CONVERTED" } });
  return { customerId: customer.id, opportunityId: opp.id };
}
