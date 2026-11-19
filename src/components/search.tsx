import { ArrowRight, SearchIcon } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { Button } from './ui/button'

export function Search({
  className = '',
  placeholder,
  ...props
}: React.ComponentProps<'button'> & { placeholder?: string }) {
  const { t } = useLanguage()
  const { setOpen } = useSearch()

  return (
    <Button
      {...props}
      variant='outline'
      className={cn(
        // shape + glass look
        'group relative h-9 w-full flex-1 justify-start overflow-hidden rounded-full border-border bg-background/40 text-sm font-normal text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/20 sm:w-40 sm:pe-10 md:flex-none lg:w-52 xl:w-64',
        // glossy inner highlight + soft shadows
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.08),0_3px_8px_rgba(0,0,0,0.08)]',
        'dark:border-white/20 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_9px_rgba(0,0,0,0.3),0_3px_8px_rgba(0,0,0,0.25)]',
        // light sheen overlays
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-linear-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 dark:before:from-white/15',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-linear-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 dark:after:from-white/10',
        className
      )}
      aria-keyshortcuts='Meta+K Control+K'
      onClick={() => setOpen(true)}
    >
      <SearchIcon
        aria-hidden='true'
        className='absolute inset-s-3 top-1/2 -translate-y-1/2 opacity-70'
        size={16}
      />
      <span className='ms-6 truncate'>{placeholder ?? t('Search')}</span>
      <ArrowRight
        aria-hidden='true'
        className='absolute inset-e-3 top-1/2 -translate-y-1/2 opacity-70 transition-all duration-200 group-hover:opacity-100 ltr:group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5'
        size={16}
      />
    </Button>
  )
}
