export type OrgApprovalStatus = "pending" | "approved" | "rejected";

export function getOrgApprovalStatus(settings: unknown): OrgApprovalStatus {
  if (!settings || typeof settings !== "object") return "approved";
  const status = (settings as Record<string, unknown>).approvalStatus;
  if (status === "pending" || status === "rejected" || status === "approved") {
    return status;
  }
  return "approved";
}

export function isOrganizationApproved(org: { isActive: boolean; settings: unknown } | null): boolean {
  if (!org) return false;
  if (!org.isActive) return false;
  return getOrgApprovalStatus(org.settings) === "approved";
}

export function orgPendingSettings() {
  return { approvalStatus: "pending" as const, requestedAt: new Date().toISOString() };
}

export function orgApprovedSettings() {
  return { approvalStatus: "approved" as const, approvedAt: new Date().toISOString() };
}

export function orgRejectedSettings() {
  return { approvalStatus: "rejected" as const, rejectedAt: new Date().toISOString() };
}
