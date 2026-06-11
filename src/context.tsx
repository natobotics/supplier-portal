import { createContext, useContext, useState, type ReactNode } from 'react'

// 'all' = consolidated group view (GBP); otherwise an entity id from data.ts
interface EntityState {
  entity: string
  setEntity: (e: string) => void
}

const EntityContext = createContext<EntityState>({ entity: 'all', setEntity: () => {} })

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState('all')
  return <EntityContext.Provider value={{ entity, setEntity }}>{children}</EntityContext.Provider>
}

export const useEntity = () => useContext(EntityContext)
