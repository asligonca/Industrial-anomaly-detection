import type { AlarmSocketStatus } from '@/types'
import { create } from 'zustand'

interface AlarmStatusState {
  status: AlarmSocketStatus
  setStatus: (status: AlarmSocketStatus) => void
}

/** Canlı alarm bağlantısının durumu: `useAlarmSocket` yazar, üst bardaki gösterge okur. */
export const useAlarmStatusStore = create<AlarmStatusState>()((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}))
