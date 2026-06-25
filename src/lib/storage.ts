import type {
  ApplicationRecord,
  ComposeDraft,
  GenerationState,
  ResumeData,
  Settings,
  StorageSchema,
} from '../types'

const DEFAULT_SETTINGS: Settings = {
  groqApiKey: '',
  gmailConnected: false,
}

const DEFAULT_GENERATION: GenerationState = {
  status: 'idle',
  hrEmail: '',
  jobDescription: '',
}

const DEFAULT_COMPOSE_DRAFT: ComposeDraft = {
  hrEmail: '',
  jobDescription: '',
}

const DEFAULT_STORAGE: StorageSchema = {
  resume: null,
  settings: DEFAULT_SETTINGS,
  history: [],
  generation: DEFAULT_GENERATION,
  composeDraft: DEFAULT_COMPOSE_DRAFT,
}

type LegacySettings = Settings & { openaiApiKey?: string; openrouterApiKey?: string }

function normalizeSettings(raw: LegacySettings): Settings {
  return {
    groqApiKey: raw.groqApiKey || raw.openrouterApiKey || raw.openaiApiKey || '',
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

export async function getGenerationState(): Promise<GenerationState> {
  const storage = await getStorage()
  return storage.generation ?? DEFAULT_GENERATION
}

export async function setGenerationState(
  partial: Partial<GenerationState>,
): Promise<void> {
  const current = await getGenerationState()
  await setStorage({ generation: { ...current, ...partial } })
}

export async function clearGenerationState(): Promise<void> {
  await setStorage({ generation: DEFAULT_GENERATION })
}

export async function getComposeDraft(): Promise<ComposeDraft> {
  const storage = await getStorage()
  return storage.composeDraft ?? DEFAULT_COMPOSE_DRAFT
}

export async function saveComposeDraft(draft: ComposeDraft): Promise<void> {
  await setStorage({ composeDraft: draft })
}

export async function clearComposeDraft(): Promise<void> {
  await setStorage({ composeDraft: DEFAULT_COMPOSE_DRAFT })
}
