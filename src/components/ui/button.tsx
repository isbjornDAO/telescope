import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "retro-btn-blue shadow",
        destructive:
          "retro-btn-destructive shadow",
        outline:
          "border border-[#4f8aae]/40 text-[#2f556e] hover:border-[#4f8aae] hover:bg-[#4f8aae]/10 hover:text-[#283470] dark:border-[#4f8aae]/50 dark:text-[#a5c8e0] dark:hover:bg-[#4f8aae]/20 dark:hover:text-white rounded-[4px] font-semibold active:translate-y-[1px] transition-all",
        secondary:
          "retro-btn-secondary !w-auto !px-4 shadow",
        ghost: "hover:bg-[#4f8aae]/10 hover:text-[#283470] dark:hover:bg-[#4f8aae]/20 dark:hover:text-white rounded-[4px]",
        link: "text-[#4f8aae] dark:text-[#7bb1d0] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
