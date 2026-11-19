import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'

export function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage()
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      aria-label={t('Change language')}
      title={t('Change language')}
      className='gap-1.5'
    >
      <Languages className='h-4 w-4' />
      <span className='text-xs font-semibold'>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </Button>
  )
}
