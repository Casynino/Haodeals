const BASE_URL = "https://www.ntzs.co.tz"

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NTZS_API_KEY}`,
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? `nTZS error ${res.status}: ${JSON.stringify(json)}`)
  }
  return json as T
}

// Normalize to Tanzanian format: 255712345678 (no +, no spaces)
export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)]/g, "")
  if (p.startsWith("+")) p = p.slice(1)
  if (p.startsWith("0")) p = "255" + p.slice(1)
  if (!p.startsWith("255")) p = "255" + p
  return p
}

export interface NtzsUser {
  id: string
  walletAddress: string
  email: string
}

// nTZS deposit lifecycle: "submitted" → "minted" (success) | "failed"/"expired"/"cancelled"
export type NtzsDepositStatus = "submitted" | "minted" | "failed" | "expired" | "cancelled" | (string & {})

export interface NtzsDeposit {
  id: string
  status: NtzsDepositStatus
  amountTzs: number
  userId?: string
}

// A minted deposit is the only success state; these are terminal failures.
export const DEPOSIT_FAILED_STATES = ["failed", "expired", "cancelled", "rejected"]
export function isDepositMinted(status: string): boolean {
  return status === "minted"
}
export function isDepositFailed(status: string): boolean {
  return DEPOSIT_FAILED_STATES.includes(status)
}

export const ntzs = {
  createUser(data: { email: string; name?: string; externalId: string; phone?: string }): Promise<NtzsUser> {
    return request("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getUser(id: string): Promise<NtzsUser & { balanceTzs: number; balanceUsdc: number }> {
    return request(`/api/v1/users/${id}`)
  },

  createDeposit(data: {
    userId: string
    amountTzs: number
    paymentMethod: "mobile_money"
    phoneNumber: string
    collectToTreasury?: boolean
  }): Promise<NtzsDeposit> {
    return request("/api/v1/deposits", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Look up the live status of a deposit — used to reconcile pending top-ups
  // without depending on the webhook firing.
  getDeposit(id: string): Promise<NtzsDeposit> {
    return request(`/api/v1/deposits/${id}`)
  },

  createWithdrawal(data: {
    userId: string
    amountTzs: number
    phoneNumber: string
  }): Promise<{ id: string; status: string; amountTzs: number; message: string }> {
    return request("/api/v1/withdrawals", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  transfer(data: {
    fromUserId: string
    toUserId?: string
    toAddress?: string
    amountTzs: number
    metadata?: Record<string, string>
  }): Promise<{ id: string; status: string }> {
    return request("/api/v1/transfers", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
