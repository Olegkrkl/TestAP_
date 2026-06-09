interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray'
}

const variants = {
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

export default function Badge({ children, variant = 'gray' }: Props) {
  return (
    <span className={`badge ${variants[variant]}`}>
      {children}
    </span>
  )
}
