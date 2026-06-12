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

export type AuthRole =
  | 'admin'
  | 'ap_clerk'
  | 'hr'
  | 'line_manager'
  | 'budget_owner'
  | 'finance_head'
  | 'ceo'
  | 'auditor'
  | 'supplier'

export interface DemoPersona {
  id: string
  name: string
  title: string
  role: AuthRole
  blurb: string
  supplierId?: string
}

// One persona per portal role — pick on the login screen, walk in their shoes.
export const DEMO_PERSONAS: DemoPersona[] = [
  { id: 'admin', name: 'Sarah Chen', title: 'AP Manager · Admin', role: 'admin', blurb: 'Everything — capture, approvals, payments, configuration' },
  { id: 'ap_clerk', name: 'Tomás Rivera', title: 'AP Clerk', role: 'ap_clerk', blurb: 'Captures invoices, checks extraction, manages suppliers' },
  { id: 'hr', name: 'Priya Nair', title: 'HR Approver', role: 'hr', blurb: 'Approves sub-contractor invoices at step 2' },
  { id: 'line_manager', name: 'James Holt', title: 'Line Manager', role: 'line_manager', blurb: 'Approves freelancer work — timesheets and invoices' },
  { id: 'budget_owner', name: 'Aisha Bello', title: 'Budget Owner', role: 'budget_owner', blurb: 'Owns POs and budgets, approves IT services spend' },
  { id: 'finance_head', name: 'David Osei', title: 'Finance Head', role: 'finance_head', blurb: 'Step-3 sign-off, payments, month-end close' },
  { id: 'ceo', name: 'Ingrid Olsen', title: 'CEO', role: 'ceo', blurb: 'Final approval on every invoice, group oversight' },
  { id: 'auditor', name: 'Hargreaves Audit LLP', title: 'Auditor', role: 'auditor', blurb: 'Read-only — audit log, reports, compliance evidence' },
  { id: 'supplier', name: 'Rajan Pillai', title: 'Supplier · Freelancer', role: 'supplier', blurb: 'Submits invoices and timesheets, tracks payment status', supplierId: 'sup-05' },
]

// Pages each role can reach. null = everything.
export const ROLE_PAGES: Record<AuthRole, string[] | null> = {
  admin: null,
  ap_clerk: ['dashboard', 'invoices', 'capture', 'suppliers', 'onboarding', 'contracts'],
  hr: ['dashboard', 'invoices', 'approvals', 'timesheets', 'onboarding', 'compliance'],
  line_manager: ['dashboard', 'invoices', 'approvals', 'timesheets', 'pos'],
  budget_owner: ['dashboard', 'invoices', 'approvals', 'pos', 'budgets', 'clientpos'],
  finance_head: ['dashboard', 'invoices', 'approvals', 'payments', 'budgets', 'assurance', 'clientpos', 'reports', 'entities'],
  ceo: ['dashboard', 'approvals', 'budgets', 'assurance', 'reports'],
  auditor: ['dashboard', 'invoices', 'assurance', 'compliance', 'reports', 'admin'],
  supplier: ['submit', 'timesheets', 'statements'],
}

// Default Approvals queue tab per role.
export const ROLE_CHAIN_TAB: Partial<Record<AuthRole, string>> = {
  hr: 'HR',
  line_manager: 'Line Manager',
  budget_owner: 'Budget Owner',
  finance_head: 'Finance Head',
  ceo: 'CEO',
}

export const canCapture = (role: AuthRole) => role === 'admin' || role === 'ap_clerk'

export interface AuthState {
  status: 'loading' | 'signed_out' | 'demo' | 'authenticated'
  email: string | null
  name: string
  title: string
  role: AuthRole
  supplierId: string | null
  liveAuth: boolean
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  enterDemo: (persona?: DemoPersona) => void
  signOut: () => Promise<void>
  accessToken: string | null
}

const defaultState: AuthState = {
  status: 'demo',
  email: null,
  name: 'Sarah Chen',
  title: 'AP Manager · Admin',
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
  const [title, setTitle] = useState('AP Manager · Admin')
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
      setTitle('Supplier portal')
    } else {
      setRole('admin')
      setSupplierId(null)
      setName(userEmail.split('@')[0])
      setTitle('Internal · Admin')
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

  const enterDemo = useCallback((persona: DemoPersona = DEMO_PERSONAS[0]) => {
    setEmail(null)
    setName(persona.name)
    setTitle(persona.title)
    setRole(persona.role)
    setSupplierId(persona.supplierId ?? null)
    setStatus('demo')
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setEmail(null)
    setAccessToken(null)
    // Always return to the sign-in / persona-picker screen so demo
    // visitors can switch roles.
    setStatus('signed_out')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        email,
        name,
        title,
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
