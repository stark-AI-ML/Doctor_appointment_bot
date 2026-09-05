import { IMessagingProvider } from '../messaging-provider.interface.js'
import logger from '../../../utils/logger.js'
import env from '../../../config/env.js'

/** Recursively find the first `YYYY-MM-DD`-style value in an object. */
function findFirstDate(obj) {
  if (!obj || typeof obj !== 'object') return null
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value
    if (value && typeof value === 'object') {
      const found = findFirstDate(value)
      if (found) return found
    }
  }
  return null
}

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

  async sendFlowMessage(to, body, flowAction = {}) {
    if (!env.meta.phoneNumberId || !env.meta.accessToken) {
      logger.debug(`[META-DRY] Flow To: ${to}\n${body}`)
      return
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${env.meta.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.meta.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
              type: 'flow',
              body: { text: body },
              action: {
                name: 'flow',
                parameters: {
                  flow_message_version: '3',
                  flow_id: env.meta.flowId,
                  flow_cta: 'Open Calendar',
                  flow_action: flowAction.action || 'navigate',
                  flow_action_payload: flowAction.payload || { screen: 'APPOINTMENT_DATE' },
                },
              },
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        logger.error(`Meta flow send error: ${JSON.stringify(errorData)}`)
        throw new Error('Failed to send flow message via Meta')
      }

      logger.debug(`Meta flow message sent to ${to}`)
    } catch (err) {
      logger.error('Meta flow send exception:', err.message)
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

        // Plain text messages
        if (msg.type === 'text') {
          return {
            phone: msg.from,
            type: 'text',
            body: msg.text.body,
          }
        }

        // Image messages (prescription upload)
        if (msg.type === 'image') {
          return {
            phone: msg.from,
            type: 'image',
            imageId: msg.image.id,
            mimeType: msg.image.mime_type,
          }
        }

        // Interactive date_time picker reply (older/unsupported — kept for reference)
        if (msg.type === 'interactive' && msg.interactive?.type === 'date_time') {
          const dt = msg.interactive.date_time
          const epochMs = Number(dt.timestamp) * 1000
          const d = new Date(epochMs)
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = d.getFullYear()
          const body = `${dd}/${mm}/${yyyy}`

          return {
            phone: msg.from,
            type: 'interactive',
            interactiveType: 'date_time',
            body,
            dateTimestamp: epochMs,
          }
        }

        // WhatsApp Flow response — the calendar sends back its data here.
        // data_json is a JSON string like {"appointment_date":"2026-09-08"}
        if (msg.type === 'interactive' && msg.interactive?.flow_response) {
          const fr = msg.interactive.flow_response
          let data = {}
          try {
            data = typeof fr.data_json === 'string' ? JSON.parse(fr.data_json) : (fr.data_json || {})
          } catch {
            data = {}
          }

          // Extract the date the user picked (any ISO/date-looking value)
          const dateValue = data.appointment_date || data.date || findFirstDate(data)
          let body = 'date selected'
          if (dateValue) {
            const dateObj = new Date(String(dateValue).includes('T') ? dateValue : `${dateValue}T00:00:00`)
            if (!isNaN(dateObj.getTime())) {
              const dd = String(dateObj.getDate()).padStart(2, '0')
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
              const yyyy = dateObj.getFullYear()
              body = `${dd}/${mm}/${yyyy}`
            }
          }

          return {
            phone: msg.from,
            type: 'interactive',
            interactiveType: 'flow_response',
            body,
            flowData: data,
            flowToken: fr.flow_token,
          }
        }

        // Button reply
        if (msg.type === 'button') {
          return {
            phone: msg.from,
            type: 'interactive',
            interactiveType: 'button',
            body: msg.button?.text || '',
          }
        }

        // List reply
        if (msg.type === 'interactive' && msg.interactive?.type === 'list_reply') {
          return {
            phone: msg.from,
            type: 'interactive',
            interactiveType: 'list_reply',
            body: msg.interactive?.list_reply?.title || '',
          }
        }
      }
    }
    return null
  }

  async downloadMedia(mediaId) {
    if (!env.meta.accessToken) throw new Error('Missing Meta access token')
    
    // 1. Get media URL
    const res = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${env.meta.accessToken}` }
    })
    if (!res.ok) throw new Error('Failed to fetch media metadata')
    const { url, mime_type } = await res.json()

    // 2. Download binary data
    const mediaRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${env.meta.accessToken}` }
    })
    if (!mediaRes.ok) throw new Error('Failed to download media binary')
    
    const buffer = await mediaRes.arrayBuffer()
    return { buffer: Buffer.from(buffer), mimeType: mime_type }
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
