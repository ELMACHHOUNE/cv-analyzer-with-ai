import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const menuSurface = 'z-50 min-w-44 overflow-hidden border border-hairline-strong bg-canvas p-1 text-ink'

const DropdownMenuSubTrigger = forwardRef(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn('flex cursor-default select-none items-center px-3 py-2.5 text-[14px] font-light outline-none focus:bg-surface-strong data-[state=open]:bg-surface-strong', inset && 'pl-8', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = forwardRef(({ className, ...props }, ref) => <DropdownMenuPrimitive.SubContent ref={ref} className={cn(menuSurface, className)} {...props} />)
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn(menuSurface, className)} {...props} />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2 px-3 py-2.5 text-[14px] font-light text-ink outline-none transition-colors focus:bg-surface-strong data-[disabled]:pointer-events-none data-[disabled]:text-muted-soft',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = forwardRef(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn('relative flex cursor-default select-none items-center py-2.5 pr-3 pl-9 text-[14px] font-light outline-none transition-colors focus:bg-surface-strong data-[disabled]:pointer-events-none data-[disabled]:text-muted-soft', className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn('relative flex cursor-default select-none items-center py-2.5 pr-3 pl-9 text-[14px] font-light outline-none transition-colors focus:bg-surface-strong data-[disabled]:pointer-events-none data-[disabled]:text-muted-soft', className)}
    {...props}
  >
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2.5 w-2.5 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label ref={ref} className={cn('label-uppercase px-3 py-2 text-muted', inset && 'pl-8', className)} {...props} />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => <DropdownMenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-hairline', className)} {...props} />)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({ className, ...props }) => <span className={cn('label-uppercase ml-auto text-[11px] text-muted-soft', className)} {...props} />
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup }
