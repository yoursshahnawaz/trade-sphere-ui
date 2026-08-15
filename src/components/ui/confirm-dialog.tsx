'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  // Graceful fallback (e.g. in isolated tests) so components don't require the provider to render.
  return ctx ?? ((o) => Promise.resolve(window.confirm(o.description ? `${o.title}\n\n${o.description}` : o.title)))
}

/** App-wide confirmation dialog. `const confirm = useConfirm(); if (await confirm({...})) …` */
export function ConfirmProvider({ children }: { children: ReactNode }): ReactNode {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((result: boolean): void => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOpen(false)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) settle(false)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-5 text-popover-foreground shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Dialog.Title className="font-heading text-lg font-semibold">{opts?.title}</Dialog.Title>
            {opts?.description && (
              <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
                {opts.description}
              </Dialog.Description>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {opts?.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors',
                  opts?.destructive ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90',
                )}
              >
                {opts?.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  )
}
