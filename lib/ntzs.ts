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
    throw new Error(json.message ?? `nTZS error ${res.status}`)
  }
  return json as T
}

export interface NtzsUser {
  id: string
  walletAddress: string
  email: string
}

export interface NtzsDeposit {
  id: string
  status: "pending" | "completed" | "failed"
  amount: number
  userId: string
}

export const ntzs = {
  createUser(data: { email: string; name?: string; externalId: string }): Promise<NtzsUser> {
    return request("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getUser(id: string): Promise<NtzsUser & { balances: { ntzs: string; usdc: number } }> {
    return request(`/api/v1/users/${id}`)
  },

  createDeposit(data: {
    userId: string
    amount: number
    paymentMethod: "mobile_money"
    phoneNumber: string
    collectToTreasury?: boolean
    metadata?: Record<string, string>
  }): Promise<NtzsDeposit> {
    return request("/api/v1/deposits", {
      method: "POST",
      body: JSON.stringify({ collectToTreasury: true, ...data }),
    })
  },
}
