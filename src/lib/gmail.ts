import type { GmailSendPayload, MessageResponse } from '../types'

function parseToken(token: chrome.identity.GetAuthTokenResult | undefined): string {
  if (!token) throw new Error('No auth token received')
  const tokenStr = typeof token === 'string' ? token : token.token
  if (!tokenStr) throw new Error('No auth token received')
  return tokenStr
}

export function connectGmailInteractive(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      try {
        parseToken(token)
        resolve()
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Auth failed'))
      }
    })
  })
}

export function sendMessage<T = unknown>(
  message: { type: string; payload?: unknown },
): Promise<MessageResponse & { data?: T }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse & { data?: T }) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message })
      } else {
        resolve(response ?? { success: false, error: 'No response' })
      }
    })
  })
}

export async function checkGmailAuth(): Promise<boolean> {
  const response = await sendMessage<boolean>({ type: 'CHECK_GMAIL_AUTH' })
  return response.success && response.data === true
}

export async function signOutGmail(): Promise<void> {
  await sendMessage({ type: 'GMAIL_SIGN_OUT' })
}

export async function sendGmailEmail(payload: GmailSendPayload): Promise<void> {
  const response = await sendMessage({ type: 'SEND_GMAIL', payload })
  if (!response.success) {
    throw new Error(response.error ?? 'Failed to send email')
  }
}

export async function getPageText(): Promise<string> {
  const response = await sendMessage<string>({ type: 'GET_PAGE_TEXT' })
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Could not read page content')
  }
  return response.data
}
