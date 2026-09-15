"use client"

import { useToast, type ToastType } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"

function ToastStatusIcon({
  toastType,
  customIcon,
}: {
  toastType: ToastType
  customIcon?: React.ReactNode
}) {
  if (customIcon) {
    return (
      <div className="w-8 h-8 shrink-0 rounded-[4px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
        {customIcon}
      </div>
    )
  }

  let style =
    "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
  let Icon = CheckCircle2

  switch (toastType) {
    case "error":
      style =
        "bg-red-50 text-red-600 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60"
      Icon = AlertCircle
      break
    case "warning":
      style =
        "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
      Icon = AlertTriangle
      break
    case "info":
      style =
        "bg-sky-50 text-sky-600 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60"
      Icon = Info
      break
    case "purple":
      style =
        "bg-purple-50 text-purple-600 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60"
      Icon = Sparkles
      break
    case "pink":
      style =
        "bg-pink-50 text-pink-600 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/60"
      Icon = Heart
      break
    case "success":
    default:
      style =
        "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
      Icon = CheckCircle2
      break
  }

  return (
    <div
      className={cn(
        "w-8 h-8 shrink-0 rounded-[4px] flex items-center justify-center border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-none",
        style
      )}
    >
      <Icon className="w-4 h-4 stroke-[2.2]" />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={6000}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        icon,
        toastType,
        badgeType,
        time,
        txHash,
        variant,
        ...props
      }) {
        const resolvedType: ToastType =
          toastType ||
          badgeType ||
          (variant === "destructive" ? "error" : "success")
        const resolvedTime = time || "just now"

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Status Icon */}
            <ToastStatusIcon toastType={resolvedType} customIcon={icon} />

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[32px]">
              <div>
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription txHash={txHash}>
                    {description}
                  </ToastDescription>
                )}
                {action}
              </div>

              <div className="flex items-center text-[10px] leading-[14px] text-zinc-400 dark:text-zinc-500 mt-1 select-none font-medium">
                <span>{resolvedTime}</span>
              </div>
            </div>

            {/* Close button */}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
