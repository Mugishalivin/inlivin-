export function getUpdatesSeenKey(userId: string | null | undefined) {
  return userId ? `updates_last_seen_at:${userId}` : "updates_last_seen_at:guest";
}

export function readUpdatesSeenAt(userId: string | null | undefined) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getUpdatesSeenKey(userId));
}

export function markUpdatesSeen(userId: string | null | undefined, timestamp = new Date().toISOString()) {
  if (typeof window === "undefined") return timestamp;
  window.localStorage.setItem(getUpdatesSeenKey(userId), timestamp);
  window.dispatchEvent(new Event("updates-seen-changed"));
  return timestamp;
}

export function isVideoMedia(mediaUrl?: string | null, mediaType?: string | null) {
  if (mediaType?.startsWith("video")) return true;
  if (!mediaUrl) return false;
  return /\.(mp4|webm|mov|m4v|ogv)$/i.test(mediaUrl);
}

