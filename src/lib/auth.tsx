// Authentication context.
//
// Live mode (Supabase env configured): magic-link sign-in via Supabase Auth.
// Role resolution: an auth user linked from suppliers.auth_user_id is a
// 'supplier' scoped to that supplier row; anyone else is 'internal' (admin).
// Demo mode: no Supabase env, or the visitor chooses "Explore the demo" —
// acts as Sarah Chen (admin) over mock data, exactly as before.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isLive } from './supabase'

export type AuthRole = 'admin' | 'supplier'

export interface AuthState {
  status: 'loading' | 'signed_out' | 'demo' | 'authenticated'
  email: string | null
  name: string
  role: AuthRole
  supplierId: string | null
  liveAuth: boolean
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  enterDemo: () => void
  signOut: () => Promise<void>
  accessToken: string | null
}

const defaultState: AuthState = {
  status: 'demo',
  email: null,
  name: 'Sarah Chen',
  role: 'admin',
  supplierId: null,
  liveAuth: false,
  signInWithEmail: async () => ({ ok: false, error: 'Auth not configured' }),
  enterDemo: () => {},
  signOut: async () => {},
  accessToken: null,
}

const AuthContext = createContext<AuthState>(defaultState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>(isLive ? 'loading' : 'demo')
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('Sarah Chen')
  const [role, setRole] = useState<AuthRole>('admin')
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const resolveRole = useCallback(async (userId: string, userEmail: string) => {
    setEmail(userEmail)
    setAccessToken((await supabase!.auth.getSession()).data.session?.access_token ?? null)
    const { data } = await supabase!
      .from('suppliers')
      .select('id, name, contact_name')
      .eq('auth_user_id', userId)
      .maybeSingle()
    if (data) {
      setRole('supplier')
      setSupplierId(data.id)
      setName(data.contact_name || data.name)
    } else {
      setRole('admin')
      setSupplierId(null)
      setName(userEmail.split('@')[0])
    }
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        void resolveRole(data.session.user.id, data.session.user.email ?? '')
      } else {
        setStatus('signed_out')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void resolveRole(session.user.id, session.user.email ?? '')
    })
    return () => sub.subscription.unsubscribe()
  }, [resolveRole])

  const signInWithEmail = useCallback(async (addr: string) => {
    if (!supabase) return { ok: false, error: 'Auth not configured in this environment' }
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin },
    })
    return error ? { ok: false, error: error.message } : { ok: true }
  }, [])

  const enterDemo = useCallback(() => {
    setEmail(null)
    setName('Sarah Chen')
    setRole('admin')
    setSupplierId(null)
    setStatus('demo')
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setEmail(null)
    setAccessToken(null)
    setStatus(isLive ? 'signed_out' : 'demo')
    if (!isLive) enterDemo()
    else setStatus('signed_out')
  }, [enterDemo])

  return (
    <AuthContext.Provider
      value={{
        status,
        email,
        name,
        role,
        supplierId,
        liveAuth: isLive,
        signInWithEmail,
        enterDemo,
        signOut,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
