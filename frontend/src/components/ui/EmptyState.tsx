import { LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  illustration?: string
}

export default function EmptyState({ icon: Icon, title, description, action, illustration }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className="w-48 h-36 object-contain mb-4 opacity-90 dark:opacity-80"
        />
      ) : Icon ? (
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      ) : null}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
