import { MetaProvider } from './providers/meta.provider.js'

/**
 * Factory: returns the messaging provider.
 */
export function createMessagingProvider() {
  return new MetaProvider()
}
