import { IMessagingProvider } from '../messaging-provider.interface.js'
import logger from '../../../utils/logger.js'
import env from '../../../config/env.js'

/**
 * Meta WhatsApp Cloud API provider.
 */
export class MetaProvider extends IMessagingProvider {
  constructor() {
    super()
    if (!env.meta.phoneNumberId || !env.meta.accessToken) {
      logger.warn('Meta credentials not fully set — messages will only be logged')
    } else {
      logger.info('Meta WhatsApp provider initialized')
    }
  }

  async sendTextMessage(to, body) {
    if (!env.meta.phoneNumberId || !env.meta.accessToken) {
      logger.debug(`[META-DRY] To: ${to}\n${body}`)
      return
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${env.meta.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${env.meta.accessToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        logger.error(`Meta send error: ${JSON.stringify(errorData)}`)
        throw new Error('Failed to send WhatsApp message via Meta')
      }

      logger.debug(`Meta message sent to ${to}`)
    } catch (err) {
      logger.error('Meta send exception:', err.message)
    }
  }

  parseIncomingMessage(req) {
    const body = req.body

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages = value?.messages

      if (messages && messages.length > 0) {
        const msg = messages[0]
        if (msg.type === 'text') {
          return {
            phone: msg.from,
            body: msg.text.body,
          }
        }
      }
    }
    return null
  }

  handleVerification(req, res) {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === env.meta.verifyToken) {
      res.status(200).send(challenge)
    } else {
      res.status(403).send('Forbidden')
    }
  }
}
