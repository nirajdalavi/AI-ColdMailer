export interface ResumeData {
  fileName: string
  base64: string
  extractedText: string
  uploadedAt: string
}

export interface Settings {
  groqApiKey: string
  senderName: string
  gmailConnected: boolean
}

export interface ApplicationRecord {
  id: string
  hrEmail: string
  jobTitle: string
  company: string
  subject: string
  body: string
  sentAt: string
  status: 'sent' | 'failed'
}

export interface GeneratedEmail {
  subject: string
  body: string
  company: string
  jobTitle: string
}

export interface GenerationState {
  status: 'idle' | 'generating' | 'done' | 'error'
  hrEmail: string
  jobDescription: string
  result?: GeneratedEmail
  error?: string
}

export interface ComposeDraft {
  hrEmail: string
  jobDescription: string
}

export interface StorageSchema {
  resume: ResumeData | null
  settings: Settings
  history: ApplicationRecord[]
  generation: GenerationState
  composeDraft: ComposeDraft
}

export type MessageType =
  | { type: 'GET_PAGE_TEXT' }
  | { type: 'SEND_GMAIL'; payload: GmailSendPayload }
  | { type: 'CHECK_GMAIL_AUTH' }
  | { type: 'CONNECT_GMAIL' }
  | { type: 'GMAIL_SIGN_OUT' }
  | {
      type: 'START_GENERATE_EMAIL'
      payload: {
        apiKey: string
        resumeText: string
        jobDescription: string
        hrEmail: string
        senderName: string
      }
    }

export interface GmailSendPayload {
  to: string
  subject: string
  body: string
  attachmentBase64: string
  attachmentFileName: string
}

export interface MessageResponse {
  success: boolean
  data?: unknown
  error?: string
}
