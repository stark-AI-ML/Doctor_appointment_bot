import express from 'express'
import cors from 'cors'
import env from './config/env.js'
import { connectDB } from './config/database.js'
import logger from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'
import { createMessagingProvider } from './integrations/whatsapp/whatsapp.factory.js'
import { createWebhookRouter } from './integrations/whatsapp/whatsapp.webhook.js'
import conversationService from './modules/conversation/conversation.service.js'

const app = express()

// ─── Middleware ──────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.static('public'))

// Request logger (dev only)
if (env.isDev) {
  app.use((req, _res, next) => {
    if (!req.url.includes('/webhook')) {
      logger.debug(`${req.method} ${req.url}`)
    }
    next()
  })
}

// ─── API Routes ─────────────────────────────────────────
app.use('/api', routes)

// ─── WhatsApp Webhook ───────────────────────────────────
const messagingProvider = createMessagingProvider()
conversationService.setProvider(messagingProvider)
app.use('/webhook/whatsapp', createWebhookRouter(messagingProvider))

// ─── Health Check ───────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Error Handler ──────────────────────────────────────
app.use(errorHandler)

// ─── Start ──────────────────────────────────────────────
async function start() {
  await connectDB()
  app.listen(env.port, () => {
    logger.info(`DocBot API running on http://localhost:${env.port}`)
    logger.info('WhatsApp provider: Meta Cloud API')
    logger.info(`Environment: ${env.nodeEnv}`)
  })
}

start().catch((err) => {
  logger.error('Failed to start:', err.message)
  process.exit(1)
})
