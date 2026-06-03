import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { DEFAULT_MODEL, clearAiConfig, loadAiConfig, saveAiConfig } from '../ai'
import { Modal } from './Modal'

const SUGGESTED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini']

/**
 * AI settings — prototype bring-your-own-key. The key is stored only in this
 * browser's localStorage and sent directly to OpenAI from the browser. Swap for
 * a server proxy later for production.
 */
export function SettingsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const existing = loadAiConfig()
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '')
  const [model, setModel] = useState(existing?.model ?? DEFAULT_MODEL)

  function save() {
    if (apiKey.trim()) saveAiConfig({ apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL })
    onSaved()
    onClose()
  }
  function disconnect() {
    clearAiConfig()
    onSaved()
    onClose()
  }

  return (
    <Modal
      title="AI settings"
      onClose={onClose}
      footer={
        <>
          {existing && (
            <button type="button" className="btn btn-danger mr-auto" onClick={disconnect}>
              Disconnect
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={!apiKey.trim()} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md border border-accent/20 bg-accent/[0.05] p-2.5 text-[11px] leading-relaxed text-fg-muted">
          <KeyRound size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Prototype: your key is stored only in this browser and sent directly to OpenAI. It is never
            committed or sent anywhere else. For a shared deployment, route this through a server proxy.
          </span>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">OpenAI API key</span>
          <input
            type="password"
            className="field"
            value={apiKey}
            autoFocus
            placeholder="sk-…"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">Model</span>
          <input
            className="field num"
            list="ai-models"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <datalist id="ai-models">
            {SUGGESTED_MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <span className="text-[10px] text-fg-dim">Pick any chat model your key can access. Default {DEFAULT_MODEL}.</span>
        </label>
      </div>
    </Modal>
  )
}
