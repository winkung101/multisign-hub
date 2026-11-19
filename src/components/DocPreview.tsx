export function DocPreview({ url, type, title }: { url: string; type: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-paper">
      {type === "application/pdf" ? (
        <iframe src={url} title={title} className="h-[70vh] w-full" />
      ) : (
        <img src={url} alt={title} className="w-full" />
      )}
      <a href={url} target="_blank" rel="noreferrer" className="block border-t border-border px-4 py-2 text-sm text-primary underline">
        เปิดเอกสารในหน้าต่างใหม่
      </a>
    </div>
  );
}
