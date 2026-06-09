import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewPageForm } from "@/components/admin/cms/NewPageForm";

export default function NewPagePage() {
  return (
    <div>
      <Link href="/admin/sayfalar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Sayfalar
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Yeni Sayfa</h1>
      <p className="mb-6 text-sm text-ink-muted">Bir başlık verin; ardından bloklarla sayfayı tasarlayın.</p>
      <NewPageForm />
    </div>
  );
}
