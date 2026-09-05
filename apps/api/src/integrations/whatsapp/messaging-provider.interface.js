/**
 * IMessagingProvider — the contract every WhatsApp provider must implement.
 *
 * When switching providers, only the provider file changes. Everything else stays the same.
 */
export class IMessagingProvider {
  /**
   * Send a plain text message to a WhatsApp number.
   * @param {string} to - WhatsApp number (e.g., "+919876543210")
   * @param {string} body - Message text
   */
  async sendTextMessage(to, body) {
    throw new Error('sendTextMessage() not implemented')
  }

  /**
   * Send a WhatsApp Flow interactive message.
   * Only supported by Meta Cloud API — other providers may not implement it.
   * @param {string} to - WhatsApp number
   * @param {string} body - Prompt text
   * @param {object} [flowAction] - { action, payload } for the navigate action
   */
  async sendFlowMessage(to, body, flowAction) {
    throw new Error('sendFlowMessage() not implemented in this provider')
  }

  /**
   * Parse the incoming webhook request to extract phone and message body.
   * @param {Request} req - Express request object
   * @returns {{ phone: string, body: string } | null}
   */
  parseIncomingMessage(req) {
    throw new Error('parseIncomingMessage() not implemented')
  }

  /**
   * Handle webhook verification (GET request).
   * @param {Request} req
   * @param {Response} res
   */
  handleVerification(req, res) {
    throw new Error('handleVerification() not implemented')
  }
}
