"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      richColors
      className="toaster group"
      icons={{
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: null,
      }}
      toastOptions={{
        style: {
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        },
        classNames: {
          toast: 'sonner-toast',
          title: 'sonner-toast-title',
          description: 'sonner-toast-description',
          actionButton: 'sonner-toast-action-button',
          cancelButton: 'sonner-toast-cancel-button',
          closeButton: 'sonner-toast-close-button',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
