import { ReactNode } from 'react'

interface Props {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ content, children, position = 'top' }: Props) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        className={`absolute left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 ${
          position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}
      >
        {content}
      </span>
    </span>
  )
}
