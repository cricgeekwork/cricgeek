export function parseBlogTags(value: string | null | undefined): string[] {
  const parts = (value ?? "").split(/[,\r\n]+/);
  const tags = parts.flatMap((part) => {
    const hashtags = part.match(/#[^\s,#]+/g);
    if (hashtags?.length) {
      return hashtags.map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean);
    }

    const tag = part.trim().replace(/^#+/, "");
    return tag ? [tag] : [];
  });
  const seen = new Set<string>();

  return tags.filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function serializeBlogTags(value: string | null | undefined): string {
  return parseBlogTags(value).join(", ");
}