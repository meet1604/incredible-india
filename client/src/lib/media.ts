function extractUrlFromIframeHtml(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export function normalizeVideoInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<iframe")) {
    return extractUrlFromIframeHtml(trimmed) ?? trimmed;
  }

  return trimmed;
}

export function getVimeoVideoId(url: string) {
  const trimmed = normalizeVideoInput(url);
  const match = trimmed.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i,
  );

  return match?.[1] ?? null;
}

export function isVimeoUrl(url: string) {
  return getVimeoVideoId(url) !== null;
}

export function getVimeoEmbedUrl(url: string) {
  const videoId = getVimeoVideoId(url);
  if (!videoId) return null;

  return `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&muted=1&loop=1&byline=0&title=0&portrait=0`;
}

export function getVimeoPlayerUrl(url: string) {
  const videoId = getVimeoVideoId(url);
  if (!videoId) return null;

  return `https://player.vimeo.com/video/${videoId}?autoplay=0&muted=1&loop=0&byline=0&title=0&portrait=0&controls=1`;
}

export function isDirectVideoSource(url: string) {
  const trimmed = normalizeVideoInput(url);

  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;

  return /\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(trimmed);
}
