import * as TabsPrimitive from '@radix-ui/react-tabs'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Tabs = forwardRef(({ className, ...props }, ref) => <TabsPrimitive.Root ref={ref} className={cn('flex flex-col gap-6', className)} {...props} />)
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = forwardRef(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn('inline-flex h-11 w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1 text-muted-foreground', className)} {...props} />)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = forwardRef(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', className)} {...props} />)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = forwardRef(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn('outline-none focus-visible:ring-2 focus-visible:ring-primary/30', className)} {...props} />)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
