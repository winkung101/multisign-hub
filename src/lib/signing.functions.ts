import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "sign-files";
const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function signedUrl(path: string) {
  const db = await admin();
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export const createDocument = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(200),
        fileName: z.string().max(255),
        fileType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        base64: z.string().max(14_000_000),
        signers: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const ext = data.fileType === "application/pdf" ? "pdf" : data.fileType === "image/png" ? "png" : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: data.fileType });
    if (up.error) throw new Error(up.error.message);
    const { data: doc, error } = await db
      .from("sign_documents")
      .insert({ title: data.title, file_path: path, file_type: data.fileType })
      .select("id, admin_token")
      .single();
    if (error) throw new Error(error.message);
    const { error: e2 } = await db
      .from("sign_signers")
      .insert(data.signers.map((name, i) => ({ document_id: doc.id, name, position: i })));
    if (e2) throw new Error(e2.message);
    return { adminToken: doc.admin_token };
  });

export const getManageView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: doc } = await db
      .from("sign_documents")
      .select("id, title, file_path, file_type, created_at")
      .eq("admin_token", data.token)
      .maybeSingle();
    if (!doc) return null;
    const { data: signers } = await db
      .from("sign_signers")
      .select("id, name, token, signature, signed_at, position")
      .eq("document_id", doc.id)
      .order("position");
    return {
      title: doc.title,
      fileType: doc.file_type,
      fileUrl: await signedUrl(doc.file_path),
      createdAt: doc.created_at,
      signers: signers ?? [],
    };
  });

export const getSignView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: me } = await db
      .from("sign_signers")
      .select("id, name, signed_at, document_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!me) return null;
    const { data: doc } = await db
      .from("sign_documents")
      .select("title, file_path, file_type")
      .eq("id", me.document_id)
      .single();
    const { data: all } = await db
      .from("sign_signers")
      .select("id, name, signed_at, position")
      .eq("document_id", me.document_id)
      .order("position");
    return {
      title: doc!.title,
      fileType: doc!.file_type,
      fileUrl: await signedUrl(doc!.file_path),
      me: { id: me.id, name: me.name, signedAt: me.signed_at },
      signers: (all ?? []).map((s) => ({ id: s.id, name: s.name, signedAt: s.signed_at })),
    };
  });

export const submitSignature = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({ signature: z.string().startsWith("data:image/png;base64,").max(500_000) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("sign_signers")
      .update({ signature: data.signature, signed_at: new Date().toISOString() })
      .eq("token", data.token)
      .is("signed_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("ลิงก์นี้เซ็นไปแล้วหรือไม่ถูกต้อง");
    return { ok: true };
  });
