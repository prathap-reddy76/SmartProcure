let mockUserId: string | null = null;
let mockRole: string | null = null;

export function setTestAuth(userId: string | null, role: string | null) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Test auth bypass is only allowed in test environment.");
  }
  mockUserId = userId;
  mockRole = role;
}

export function getTestAuth() {
  if (process.env.NODE_ENV === "test" && mockUserId) {
    return { user: { id: mockUserId, role: mockRole } };
  }
  return null;
}
