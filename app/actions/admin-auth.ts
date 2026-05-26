"use server"

import { adminSignIn, adminSignOut } from "@/auth-admin"

export async function tryAdminSignIn(email: string, password: string): Promise<void> {
  try {
    await adminSignIn("credentials", { email, password, redirect: false })
  } catch {
    // Not an admin or wrong credentials — silently ignored
  }
}

export async function tryAdminSignOut(): Promise<void> {
  try {
    await adminSignOut({ redirect: false })
  } catch {
    // Ignore
  }
}
