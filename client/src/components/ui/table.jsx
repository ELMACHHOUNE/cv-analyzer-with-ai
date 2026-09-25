import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn('w-full border-collapse text-[14px]', className)} {...props} />
  </div>
))
Table.displayName = 'Table'

const TableHeader = forwardRef(({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />)
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef(({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />)
TableBody.displayName = 'TableBody'

const TableFooter = forwardRef(({ className, ...props }, ref) => <tfoot ref={ref} className={cn('border-t border-hairline-strong', className)} {...props} />)
TableFooter.displayName = 'TableFooter'

const TableRow = forwardRef(({ className, ...props }, ref) => <tr ref={ref} className={cn('border-b border-hairline transition-colors last:border-0 hover:bg-surface-soft', className)} {...props} />)
TableRow.displayName = 'TableRow'

const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('h-12 px-4 text-left align-middle label-uppercase text-muted [&:has([role=checkbox])]:pr-0', className)} {...props} />
))
TableHead.displayName = 'TableHead'

const TableCell = forwardRef(({ className, ...props }, ref) => <td ref={ref} className={cn('p-4 align-middle text-body [&:has([role=checkbox])]:pr-0', className)} {...props} />)
TableCell.displayName = 'TableCell'

const TableCaption = forwardRef(({ className, ...props }, ref) => <caption ref={ref} className={cn('mt-4 text-[14px] font-light text-muted', className)} {...props} />)
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
