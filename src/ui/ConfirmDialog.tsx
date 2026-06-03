import { Modal } from './Modal'

/** Reusable confirm dialog — replaces window.confirm for destructive actions. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-fg-muted">{body}</p>
    </Modal>
  )
}
