import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border text-[16px] font-semibold whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "midas-btn-primary border-ink",
        outline: "rounded-[30px] border-ink bg-page text-ink hover:bg-ink hover:text-on-ink",
        secondary: "rounded-[30px] border-transparent bg-black text-on-ink hover:bg-accent-red",
        ghost: "border-transparent bg-transparent text-ink hover:bg-surface-off",
        destructive: "border-accent-red bg-accent-red text-on-ink",
        link: "border-transparent bg-transparent text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[15px] py-[7px]",
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-5 py-2.5",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
