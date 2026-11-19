CREATE TABLE public.sign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  admin_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sign_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.sign_documents(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  signature text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sign_documents TO service_role;
GRANT ALL ON public.sign_signers TO service_role;
ALTER TABLE public.sign_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sign_signers ENABLE ROW LEVEL SECURITY;