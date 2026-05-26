"use server"

import { adminSignIn, adminSignOut } from "@/auth-admin"

/**
 * Attempts admin sign-in via Server Action (bypasses NextAuth CSRF check).
 * Returns true if the credentials belong to an admin user, false otherwise.
 * Never throws — errors mean "not admin" and are silently swallowed.
 */
export async function tryAdminSignIn(email: string, password: string): Promise<boolean> {
  try {
    await adminSignIn("credentials", { email, password, redirect: false })
    return true
  } catch {
    return false
  }
}

/**
 * Clears the hao-admin-token cookie via Server Action.
 * Intentionally does NOT clear authjs.session-token so the customer
 * session (other tabs, customer browsing) is unaffected.
 */
export async function tryAdminSignOut(): Promise<void> {
  try {
    await adminSignOut({ redirect: false })
  } catch {
    // Ignore
  }
}
