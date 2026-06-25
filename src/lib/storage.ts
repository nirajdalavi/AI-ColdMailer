import type { ApplicationRecord, ResumeData, Settings, StorageSchema } from '../types'

const DEFAULT_SETTINGS: Settings = {
  openrouterApiKey: '',
  gmailConnected: false,
}

const DEFAULT_STORAGE: StorageSchema = {
  resume: null,
  settings: DEFAULT_SETTINGS,
  history: [],
}

type LegacySettings = Settings & { openaiApiKey?: string }

function normalizeSettings(raw: LegacySettings): Settings {
  return {
    openrouterApiKey: raw.openrouterApiKey || raw.openaiApiKey || '',
    gmailConnected: raw.gmailConnected ?? false,
  }
}

function getStorage(): Promise<StorageSchema> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      DEFAULT_STORAGE as unknown as Record<string, unknown>,
      (result) => {
        const storage = result as unknown as StorageSchema
        resolve({
          ...storage,
          settings: normalizeSettings(storage.settings as LegacySettings),
        })
      },
    )
  })
}

function setStorage(partial: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial as Record<string, unknown>, resolve)
  })
}

export async function getResume(): Promise<ResumeData | null> {
  const storage = await getStorage()
  return storage.resume
}

export async function saveResume(resume: ResumeData): Promise<void> {
  await setStorage({ resume })
}

export async function getSettings(): Promise<Settings> {
  const storage = await getStorage()
  return storage.settings
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setStorage({ settings })
}

export async function getHistory(): Promise<ApplicationRecord[]> {
  const storage = await getStorage()
  return storage.history
}

export async function addToHistory(record: ApplicationRecord): Promise<void> {
  const history = await getHistory()
  await setStorage({ history: [record, ...history] })
}
