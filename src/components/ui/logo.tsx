import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-10 h-10",
  xl: "w-12 h-12"
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/FinanzIA-logo.png" 
        alt="FinanzIA Logo" 
        className={cn("object-contain", sizes[size])}
      />
      {showText && (
        <span className="font-bold text-gray-900 dark:text-white">
          FinanzIA
        </span>
      )}
    </div>
  )
} 