import * as TabsPrimitive from '@radix-ui/react-tabs'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/*
  category-tab — UPPERCASE label with 12px vertical padding. Inactive is
  muted, active is ink with a 2px ink underline. No plate, no radius.
*/
const Tabs = forwardRef(({ className, ...props }, ref) => <TabsPrimitive.Root ref={ref} className={cn('flex flex-col', className)} {...props} />)
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('no-scrollbar -mx-5 flex w-full items-end gap-6 overflow-x-auto border-b border-hairline px-5 sm:mx-0 sm:w-auto sm:px-0', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'label-uppercase -mb-px shrink-0 border-b-2 border-transparent py-3 text-muted transition-colors duration-150 outline-none hover:text-ink',
      'data-[state=active]:border-ink data-[state=active]:text-ink',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('outline-none', className)} {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
