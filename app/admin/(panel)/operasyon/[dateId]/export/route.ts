import { getStaffUser } from "@/lib/auth";
import { getDepartureOps } from "@/lib/operations";
import { formatMoney } from "@/lib/money";
import { paxTypeLabel, reservationStatusLabel } from "@/lib/labels";

function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export async function GET(req: Request, { params }: { params: Promise<{ dateId: string }> }) {
  const user = await getStaffUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { dateId } = await params;
  const type = new URL(req.url).searchParams.get("type") ?? "pax";
  const ops = await getDepartureOps(dateId);
  if (!ops) return new Response("Not found", { status: 404 });

  let rows: (string | number)[][];
  if (type === "payment") {
    rows = [["Referans", "Müşteri", "Toplam", "Ödenen", "Bakiye", "Durum"], ...ops.payment.map((p) => [p.ref, p.customer, formatMoney(p.total), formatMoney(p.paid), formatMoney(p.balance), reservationStatusLabel[p.status]])];
  } else {
    rows = [["Referans", "Müşteri", "Yolcu", "Tip", "Oda"], ...ops.pax.map((p) => [p.ref, p.customer, p.name, paxTypeLabel[p.paxType], p.room])];
  }

  // DEMO stamp — this is an example export, not a real operational document.
  rows = [["DEMO / ÖRNEK ÇIKTI — gerçek operasyon belgesi değildir, bağlayıcı değildir."], [], ...rows];

  const body = "﻿" + toCsv(rows); // UTF-8 BOM so Excel reads Turkish chars correctly
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="DEMO-operasyon-${type}-${ops.td.startDate.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
