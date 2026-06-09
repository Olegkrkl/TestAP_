import { Star } from 'lucide-react'

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=student2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=student3',
]

export default function SocialProofBar() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-9 h-9 rounded-full ring-2 ring-[#2e1065] bg-white/10"
            />
          ))}
        </div>
        <span className="text-sm text-white/80">
          <span className="font-semibold text-white">+2,400</span> студентів вже навчаються
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <span className="font-semibold text-white">4.9/5</span>
      </div>
    </div>
  )
}
