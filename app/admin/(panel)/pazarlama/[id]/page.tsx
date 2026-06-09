import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCampaign, listSegments } from "@/lib/crm";
import { CampaignComposer } from "@/components/admin/crm/CampaignComposer";

export const metadata = { title: "Kampanya" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, segments] = await Promise.all([getCampaign(id), listSegments()]);
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/pazarlama" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Pazarlama</Link>
      <h1 className="text-2xl font-extrabold text-ink">{campaign.name}</h1>
      <CampaignComposer
        campaign={{
          id: campaign.id, name: campaign.name, subject: campaign.subject, body: campaign.body,
          segmentId: campaign.segmentId, status: campaign.status,
          sentAt: campaign.sentAt?.toISOString() ?? null,
          stats: (campaign.stats as unknown as { sent?: number; failed?: number; total?: number }) ?? null,
          recipients: campaign.recipients.map((r) => ({ id: r.id, name: `${r.customer.firstName} ${r.customer.lastName}`, email: r.customer.email, status: r.status })),
        }}
        segments={segments.map((s) => ({ id: s.id, name: s.name, memberCount: s.memberCount }))}
      />
    </div>
  );
}
