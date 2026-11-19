import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocPreview } from "@/components/DocPreview";
import { getManageView } from "@/lib/signing.functions";

export const Route = createFileRoute("/manage/$token")({
  head: () => ({
    meta: [
      { title: "จัดการเอกสาร — ลงนาม" },
      { name: "description", content: "ดูสถานะการเซ็นและคัดลอกลิงก์ของผู้เซ็นแต่ละคน" },
      { property: "og:title", content: "จัดการเอกสาร — ลงนาม" },
      { property: "og:description", content: "ดูสถานะการเซ็นและคัดลอกลิงก์ของผู้เซ็นแต่ละคน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => getManageView({ data: { token: params.token } }),
  component: Manage,
  errorComponent: () => <p className="p-10 text-center">ไม่พบเอกสาร</p>,
});

function Manage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
    const t = setInterval(() => router.invalidate(), 15000);
    return () => clearInterval(t);
  }, [router]);
  if (!data) return <p className="p-10 text-center">ไม่พบเอกสาร</p>;
  const done = data.signers.filter((s) => s.signed_at).length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← สร้างเอกสารใหม่</Link>
      <h1 className="mt-3 text-3xl font-bold">{data.title}</h1>
      <p className="mt-1 text-muted-foreground">เซ็นแล้ว {done} จาก {data.signers.length} คน</p>
      <p className="mt-4 rounded-md bg-secondary p-3 text-sm">
        เก็บลิงก์หน้านี้ไว้ เพื่อกลับมาดูสถานะภายหลัง ส่งลิงก์ด้านล่างให้ผู้เซ็นแต่ละคน (ห้ามส่งลิงก์ของคนอื่น)
      </p>

      <ul className="mt-6 space-y-3">
        {data.signers.map((s) => {
          const link = `${origin}/sign/${s.token}`;
          return (
            <li key={s.id} className="rounded-md border border-border bg-card p-4 shadow-paper">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.signed_at ? (
                    <p className="flex items-center gap-1 text-sm text-success"><Check className="size-4" /> เซ็นแล้ว {new Date(s.signed_at).toLocaleString("th-TH")}</p>
                  ) : (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="size-4" /> รอเซ็น</p>
                  )}
                </div>
                {s.signature && <img src={s.signature} alt={`ลายเซ็นของ ${s.name}`} className="h-12 w-28 object-contain" />}
              </div>
              {!s.signed_at && (
                <div className="mt-3 flex gap-2">
                  <input readOnly value={link} aria-label={`ลิงก์ของ ${s.name}`} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(link);
                      toast.success(`คัดลอกลิงก์ของ ${s.name} แล้ว`);
                    }}
                  >
                    <Copy /> คัดลอก
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 mb-3 text-xl font-bold">เอกสาร</h2>
      <DocPreview url={data.fileUrl} type={data.fileType} title={data.title} />
    </main>
  );
}
