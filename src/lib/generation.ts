import { sendMessage } from './gmail'

export async function startEmailGeneration(payload: {
  apiKey: string
  resumeText: string
  jobDescription: string
  hrEmail: string
}): Promise<void> {
  const response = await sendMessage({
    type: 'START_GENERATE_EMAIL',
    payload,
  })
  if (!response.success) {
    throw new Error(response.error ?? 'Failed to start generation')
  }
}
