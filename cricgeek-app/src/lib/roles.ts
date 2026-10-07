export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}

// "Writer" is a descriptive label for a user who has published content —
// it is NOT a permission gate. Any authenticated user can publish.
// isWriterRole is retained only for admin-panel or moderation operations.
export function isWriterRole(role?: string | null): boolean {
  return role === "writer" || role === "admin";
}

// Publishing requires authentication only. The caller must verify the user
// is signed in (userId present) — role is irrelevant.
export function canPublishBlogs(userId?: string | null): boolean {
  return Boolean(userId);
}
