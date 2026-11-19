import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocPreview } from "@/components/DocPreview";
import { SignaturePad } from "@/components/SignaturePad";
import { getSignView, submitSignature } from "@/lib/signing.functions";

export const Route = createFileRoute("/sign/$token")({
  head: () => ({
    meta: [
      { title: "เซ็นเอกสาร — ลงนาม" },
      { name: "description", content: "อ่านเอกสารและวาดลายเซ็นของคุณ" },
      { property: "og:title", content: "เซ็นเอกสาร — ลงนาม" },
      { property: "og:description", content: "อ่านเอกสารและวาดลายเซ็นของคุณ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => getSignView({ data: { token: params.token } }),
  component: Sign,
  errorComponent: () => <p className="p-10 text-center">ลิงก์ไม่ถูกต้อง</p>,
});

function Sign() {
  const { token } = Route.useParams();
  const router = useRouter();
  const data = Route.useLoaderData();
  const [sig, setSig] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!data) return <p className="p-10 text-center">ลิงก์ไม่ถูกต้อง</p>;

  async function submit() {
    if (!sig) return;
    setBusy(true);
    try {
      await submitSignature({ data: { token, signature: sig } });
      toast.success("เซ็นเรียบร้อยแล้ว");
      await router.invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">คำขอเซ็นเอกสาร</p>
      <h1 className="mt-2 text-3xl font-bold">{data.title}</h1>
      <p className="mt-1 text-muted-foreground">สำหรับ: <span className="font-medium text-foreground">{data.me.name}</span></p>

      <div className="mt-6"><DocPreview url={data.fileUrl} type={data.fileType} title={data.title} /></div>

      <section className="mt-8 rounded-md border border-border bg-card p-6 shadow-paper">
        {data.me.signedAt ? (
          <p className="flex items-center gap-2 font-medium text-success">
            <Check /> คุณเซ็นเอกสารนี้แล้วเมื่อ {new Date(data.me.signedAt).toLocaleString("th-TH")}
          </p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">ลายเซ็นของคุณ</h2>
            <SignaturePad onChange={setSig} />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
              ฉันได้อ่านเอกสารและยินยอมลงลายมือชื่อในนาม {data.me.name}
            </label>
            <Button size="lg" className="w-full" disabled={!sig || !agree || busy} onClick={submit}>
              {busy ? "กำลังบันทึก…" : "ยืนยันการเซ็น"}
            </Button>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">ผู้เซ็นทั้งหมด</h2>
        <ul className="space-y-1 text-sm">
          {data.signers.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-border py-2">
              <span>{s.name}</span>
              <span className={s.signedAt ? "text-success" : "text-muted-foreground"}>{s.signedAt ? "เซ็นแล้ว" : "รอเซ็น"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
