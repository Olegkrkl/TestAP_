import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await authApi.forgotPassword(email).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Лист надіслано</h2>
        <p className="text-gray-500 text-sm mb-6">Якщо цей email зареєстрований, ви отримаєте інструкції для відновлення паролю.</p>
        <Link to="/login" className="btn-primary">Повернутися до входу</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Відновлення паролю</h1>
      <p className="text-gray-500 text-sm mb-6">Введіть ваш email і ми надішлемо посилання для відновлення</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="name@example.com" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Надсилання...' : 'Надіслати'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-5">
        <Link to="/login" className="text-primary-600 hover:underline">← Повернутися до входу</Link>
      </p>
    </div>
  )
}
