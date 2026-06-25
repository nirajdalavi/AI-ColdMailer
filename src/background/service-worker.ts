import type { GmailSendPayload, MessageResponse, MessageType } from '../types'

function getAuthToken(interactive: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (!token) {
        reject(new Error('No auth token received'))
      } else {
        const tokenStr = typeof token === 'string' ? token : token.token
        if (!tokenStr) {
          reject(new Error('No auth token received'))
        } else {
          resolve(tokenStr)
        }
      }
    })
  })
}

function buildMimeMessage(payload: GmailSendPayload): string {
  const boundary = `boundary_${Date.now()}`
  const lines = [
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    payload.body,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${payload.attachmentFileName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${payload.attachmentFileName}"`,
    '',
    payload.attachmentBase64,
    '',
    `--${boundary}--`,
  ]
  return lines.join('\r\n')
}

function encodeMimeMessage(raw: string): string {
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sendGmailMessage(payload: GmailSendPayload): Promise<void> {
  const token = await getAuthToken(true)
  const raw = buildMimeMessage(payload)
  const encoded = encodeMimeMessage(raw)

  const response = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message =
      (error as { error?: { message?: string } }).error?.message ??
      `Gmail API error (${response.status})`
    throw new Error(message)
  }
}

async function checkGmailAuth(): Promise<boolean> {
  try {
    await getAuthToken(false)
    return true
  } catch {
    return false
  }
}

async function connectGmail(): Promise<boolean> {
  try {
    await getAuthToken(true)
    return true
  } catch {
    return false
  }
}

async function signOutGmail(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      const tokenStr = token ? (typeof token === 'string' ? token : token.token) : null
      if (tokenStr) {
        chrome.identity.removeCachedAuthToken({ token: tokenStr }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  })
}

async function getPageText(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selectors = ['main', 'article', '[role="main"]', '.job-description', '#job-description']
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el?.textContent && el.textContent.trim().length > 200) {
          return el.textContent.trim()
        }
      }
      return document.body.innerText.trim().slice(0, 15000)
    },
  })

  const text = results[0]?.result as string | undefined
  if (!text) throw new Error('Could not extract page text')
  return text
}

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse: (response: MessageResponse) => void) => {
    const handle = async () => {
      try {
        switch (message.type) {
          case 'CHECK_GMAIL_AUTH': {
            const connected = await checkGmailAuth()
            sendResponse({ success: true, data: connected })
            break
          }
          case 'CONNECT_GMAIL': {
            const connected = await connectGmail()
            sendResponse({ success: true, data: connected })
            break
          }
          case 'GMAIL_SIGN_OUT': {
            await signOutGmail()
            sendResponse({ success: true })
            break
          }
          case 'SEND_GMAIL': {
            await sendGmailMessage(message.payload)
            sendResponse({ success: true })
            break
          }
          case 'GET_PAGE_TEXT': {
            const text = await getPageText()
            sendResponse({ success: true, data: text })
            break
          }
          default:
            sendResponse({ success: false, error: 'Unknown message type' })
        }
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    handle()
    return true
  },
)
