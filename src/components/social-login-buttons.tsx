import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const base =
  'relative inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium antialiased shadow-sm transition duration-300 ease-in select-none hover:shadow-md hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.35)]'

type SocialLoginButtonsProps = {
  onGoogle?: () => void
  onFacebook?: () => void
  onTwitter?: () => void
  disabled?: boolean
  className?: string
}

export function SocialLoginButtons({
  onGoogle,
  onFacebook,
  onTwitter,
  disabled,
  className,
}: SocialLoginButtonsProps) {
  const { t } = useLanguage()

  return (
    <div className={cn('flex flex-col space-y-3', className)}>
      {/* Google */}
      <button
        type='button'
        onClick={onGoogle}
        disabled={disabled}
        className={cn(
          base,
          'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-gray-50'
        )}
      >
        <svg
          className='h-4 w-4 shrink-0'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            fill='#EA4335'
            d='M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z'
          />
          <path
            fill='#34A853'
            d='M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z'
          />
          <path
            fill='#4A90E2'
            d='M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z'
          />
          <path
            fill='#FBBC05'
            d='M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z'
          />
        </svg>
        <span>{t('Continue with Google')}</span>
      </button>

      {/* Facebook */}
      <button
        type='button'
        onClick={onFacebook}
        disabled={disabled}
        className={cn(
          base,
          'border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600'
        )}
      >
        <svg
          width='1.5em'
          height='1.5em'
          strokeWidth='1.5'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='h-4 w-4 shrink-0 stroke-2'
          aria-hidden='true'
        >
          <path
            d='M17 2H14C12.6739 2 11.4021 2.52678 10.4645 3.46447C9.52678 4.40215 9 5.67392 9 7V10H6V14H9V22H13V14H16L17 10H13V7C13 6.73478 13.1054 6.48043 13.2929 6.29289C13.4804 6.10536 13.7348 6 14 6H17V2Z'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
        <span>{t('Continue with Facebook')}</span>
      </button>

      {/* Twitter (X) */}
      <button
        type='button'
        onClick={onTwitter}
        disabled={disabled}
        className={cn(
          base,
          'border-stone-900 bg-linear-to-b from-stone-700 to-stone-800 text-stone-50 hover:border-stone-900 hover:from-stone-800 hover:to-stone-800'
        )}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 512 512'
          className='h-4 w-4 shrink-0'
          fill='currentColor'
          aria-hidden='true'
        >
          <path d='M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z' />
        </svg>
        <span>{t('Continue with Twitter')}</span>
      </button>
    </div>
  )
}
