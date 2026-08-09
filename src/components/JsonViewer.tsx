export function JsonViewer({ data }: { data: unknown }) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return <pre className="json-viewer">{text}</pre>;
}