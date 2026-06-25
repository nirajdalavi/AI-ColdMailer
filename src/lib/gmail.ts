import type { GmailSendPayload, MessageResponse } from '../types'

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

export async function connectGmail(): Promise<boolean> {
  const response = await sendMessage<boolean>({ type: 'CONNECT_GMAIL' })
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
