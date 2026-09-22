"use client"

import * as React from "react"
import { Cross2Icon } from "@radix-ui/react-icons"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed z-[99999999] pointer-events-none flex max-h-screen w-[320px] max-w-[calc(100vw-1rem)] flex-col gap-2 bottom-2 right-2 sm:bottom-3 sm:right-3",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-[10px] overflow-hidden rounded-[4px] p-[10px] bg-white dark:bg-zinc-900 shadow-[0_0_6px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] hover:shadow-[0_0_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_6px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.18)] transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full duration-300",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      txHash?: string
      avatar?: string
      badgeType?: string
      time?: string
    }
>(({ className, variant, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {children}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded-[3px] border px-2 text-xs font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "w-5 h-5 flex items-center justify-center text-[#AAAAAA] hover:text-[#666666] dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer focus:outline-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <Cross2Icon className="h-3 w-3" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-[13px] mb-0.5 break-words",
      className
    )}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> & { txHash?: string }
>(({ className, txHash, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn(
        "text-[11px] leading-[13px] text-[#666666] dark:text-zinc-300 break-words py-[3px] min-h-[24px]",
        className
      )}
      {...props}
    >
      {children}
      {txHash && (
        <a
          href={`https://snowscan.xyz/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-[10px] block mt-0.5"
        >
          View on Snowscan
        </a>
      )}
    </ToastPrimitives.Description>
  )
})
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
