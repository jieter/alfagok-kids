// Unpacks a gzipped text file with the browser's built-in DecompressionStream.
export async function gunzipText(data: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(data);
  // a server sending it with Content-Encoding: gzip lets the browser unpack it already
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
