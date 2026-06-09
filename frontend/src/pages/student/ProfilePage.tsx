import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setUser } from '@/app/slices/authSlice'
import { usersApi } from '@/api/usersApi'
import { authApi } from '@/api/authApi'
import { User, Award, Lock } from 'lucide-react'
import type { User as UserType } from '@/app/slices/authSlice'

export default function ProfilePage() {
  const { user } = useAppSelector(s => s.auth)
  const dispatch = useAppDispatch()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const updated = await usersApi.updateMe({ full_name: fullName })
      dispatch(setUser(updated as UserType))
      setMsg('Збережено!')
      setTimeout(() => setMsg(''), 2000)
    } catch (e: any) { setMsg(e.message) }
    finally { setSaving(false) }
  }

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authApi.changePassword({ current_password: oldPass, new_password: newPass })
      setPassMsg('Пароль змінено!')
      setOldPass(''); setNewPass('')
      setTimeout(() => setPassMsg(''), 2000)
    } catch (e: any) { setPassMsg(e.message) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Профіль</h1>

      {/* Profile info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 text-2xl font-bold">
            {user?.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900 dark:text-white">{user?.full_name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mt-1 capitalize">{user?.role}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="label flex items-center gap-1"><User className="w-3.5 h-3.5" />Повне ім'я</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={user?.email} disabled className="input opacity-60 cursor-not-allowed" />
            </div>
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary self-start">
            {saving ? 'Збереження...' : 'Зберегти профіль'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4" />Зміна паролю</h2>
        <form onSubmit={handleChangePass} className="space-y-3">
          <div>
            <label className="label">Поточний пароль</label>
            <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Новий пароль</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input" required minLength={6} />
          </div>
          {passMsg && <p className={passMsg.includes('змінено') ? 'text-green-600' : 'text-red-500'} >{passMsg}</p>}
          <button type="submit" className="btn-primary">Змінити пароль</button>
        </form>
      </div>

      {/* Gamification */}
      <div className="card">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Award className="w-4 h-4" />Досягнення</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="text-3xl mb-1">🔥</div>
            <div className="font-bold text-xl">{user?.streak_days}</div>
            <div className="text-xs text-gray-500">днів серії</div>
          </div>
        </div>
      </div>
    </div>
  )
}
