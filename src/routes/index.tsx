import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDocument } from "@/lib/signing.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ลงนาม — สร้างเอกสารให้หลายคนเซ็น" },
      { name: "description", content: "อัปโหลดเอกสาร เพิ่มรายชื่อผู้เซ็น แล้วรับลิงก์เซ็นแยกของแต่ละคน" },
      { property: "og:title", content: "ลงนาม — สร้างเอกสารให้หลายคนเซ็น" },
      { property: "og:description", content: "อัปโหลดเอกสาร เพิ่มรายชื่อผู้เซ็น แล้วรับลิงก์เซ็นแยกของแต่ละคน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function toBase64(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Index() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [signers, setSigners] = useState(["", ""]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await doSubmit();
  }

  async function doSubmit(): Promise<void> {
    const names = signers.map((s) => s.trim()).filter(Boolean);
    if (!file) { toast.error("กรุณาเลือกไฟล์เอกสาร"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("ไฟล์ต้องไม่เกิน 10MB"); return; }
    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type))
      { toast.error("รองรับเฉพาะ PDF, PNG, JPG"); return; }
    if (!names.length) { toast.error("เพิ่มผู้เซ็นอย่างน้อย 1 คน"); return; }
    setBusy(true);
    try {
      const { adminToken } = await createDocument({
        data: {
          title: title.trim(),
          fileName: file.name,
          fileType: file.type as "application/pdf",
          base64: await toBase64(file),
          signers: names,
        },
      });
      navigate({ to: "/manage/$token", params: { token: adminToken } });
    } catch (err) {
      toast.error("สร้างเอกสารไม่สำเร็จ: " + (err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">ลงนาม</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight">ส่งเอกสารให้หลายคนเซ็น</h1>
      <p className="mt-2 text-muted-foreground">อัปโหลดเอกสาร ใส่ชื่อผู้เซ็น แล้วส่งลิงก์ของแต่ละคนไปให้</p>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-md border border-border bg-card p-6 shadow-paper">
        <div className="space-y-2">
          <Label htmlFor="title">ชื่อเอกสาร</Label>
          <Input id="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น สัญญาเช่าห้อง 2569" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">ไฟล์เอกสาร (PDF, PNG, JPG)</Label>
          <label htmlFor="file" className="flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary">
            <FileUp className="size-5 text-primary" />
            <span className="truncate">{file ? file.name : "แตะเพื่อเลือกไฟล์"}</span>
          </label>
          <input id="file" type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="space-y-2">
          <Label>ผู้เซ็น</Label>
          {signers.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                aria-label={`ชื่อผู้เซ็นคนที่ ${i + 1}`}
                value={s}
                maxLength={100}
                placeholder={`ผู้เซ็นคนที่ ${i + 1}`}
                onChange={(e) => setSigners(signers.map((v, j) => (j === i ? e.target.value : v)))}
              />
              {signers.length > 1 && (
                <Button type="button" variant="ghost" size="icon" aria-label="ลบ" onClick={() => setSigners(signers.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              )}
            </div>
          ))}
          {signers.length < 20 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setSigners([...signers, ""])}>
              <Plus /> เพิ่มผู้เซ็น
            </Button>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "กำลังสร้าง…" : "สร้างลิงก์เซ็น"}
        </Button>
      </form>
    </main>
  );
}
