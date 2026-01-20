import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2",
        "text-sm text-gray-900 placeholder:text-gray-400",
        "transition-colors",
        "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "hover:border-gray-300",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
