import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export type ApiKey = {
  id: string
  accountId: string
  name: string
  last4: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export type CreatedApiKey = ApiKey & {
  token: string
}

export const API_KEYS_KEY = ['api-keys'] as const

export function useApiKeysQuery(accountId?: string | null) {
  return useQuery<ApiKey[]>({
    queryKey: [...API_KEYS_KEY, accountId],
    enabled: Boolean(accountId),
    queryFn: async () => {
      const { data } = await apiClient.get('/api-keys', {
        params: { accountId },
      })
      return data as ApiKey[]
    },
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { accountId: string; name?: string }) => {
      const { data } = await apiClient.post('/api-keys', payload)
      return data as CreatedApiKey
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...API_KEYS_KEY, data.accountId] })
    },
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (key: ApiKey) => {
      const { data } = await apiClient.delete(`/api-keys/${key.id}`)
      return data as ApiKey
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...API_KEYS_KEY, data.accountId] })
    },
  })
}
