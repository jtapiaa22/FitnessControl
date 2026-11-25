import type { FitnessApi } from '../shared/api'

declare global {
  interface Window {
    api: FitnessApi
  }
}
