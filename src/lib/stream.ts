export async function streamSSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed (${response.status})`);
  }
  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let ni: number;
    while ((ni = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, ni);
      buffer = buffer.slice(ni + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const js = line.slice(6).trim();
      if (js === "[DONE]") return;
      try {
        const p = JSON.parse(js);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
}
