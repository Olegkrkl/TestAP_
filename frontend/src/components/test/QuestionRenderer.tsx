import { useState } from 'react'
import type { Question } from '@/app/slices/testsSlice'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check } from 'lucide-react'

interface Props {
  question: Question
  answer: unknown
  onChange: (answer: unknown) => void
  showResult?: boolean
  correctAnswer?: unknown
  trainingMode?: boolean
}

export default function QuestionRenderer({ question, answer, onChange, showResult, correctAnswer, trainingMode }: Props) {
  const { type, options } = question
  const choices = (options.choices as string[]) || []

  const isCorrect = (choice: string) => {
    if (Array.isArray(correctAnswer)) return correctAnswer.includes(choice)
    return correctAnswer === choice
  }

  const choiceClass = (choice: string) => {
    const base = 'flex items-center gap-3 p-3.5 sm:p-3 min-h-[52px] rounded-xl border-2 transition-all cursor-pointer touch-manipulation active:scale-[0.99]'
    if (showResult) {
      if (isCorrect(choice)) return `${base} border-green-400 bg-green-50 dark:bg-green-900/20`
      if ((Array.isArray(answer) ? answer.includes(choice) : answer === choice) && !isCorrect(choice))
        return `${base} border-red-400 bg-red-50 dark:bg-red-900/20`
      return `${base} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`
    }
    const selected = Array.isArray(answer) ? answer.includes(choice) : answer === choice
    return `${base} ${selected
      ? 'border-primary-500 dark:border-violet-400 bg-primary-100 dark:bg-violet-600/30 dark:ring-2 dark:ring-violet-400/40 shadow-sm'
      : 'border-gray-200 dark:border-gray-600/80 bg-white dark:bg-gray-900/70 hover:border-primary-300 dark:hover:border-violet-500/50'}`
  }

  const ChoiceCheck = ({ selected }: { selected: boolean }) =>
    selected ? (
      <Check className="w-5 h-5 text-primary-600 shrink-0 animate-check-pop ml-auto" />
    ) : null

  if (type === 'single-choice') {
    return (
      <div className="space-y-2">
        {choices.map((choice, i) => {
          const selected = answer === choice
          return (
          <label key={i} className={choiceClass(choice)}>
            <input type="radio" name={question.id} value={choice} checked={selected} onChange={() => !showResult && onChange(choice)} className="accent-primary-600" />
            <span className="text-gray-800 dark:text-gray-200 flex-1">{choice}</span>
            {!showResult && <ChoiceCheck selected={selected} />}
          </label>
          )
        })}
      </div>
    )
  }

  if (type === 'multiple-choice') {
    const arr = (answer as string[]) || []
    const toggle = (choice: string) => {
      if (showResult) return
      onChange(arr.includes(choice) ? arr.filter(a => a !== choice) : [...arr, choice])
    }
    return (
      <div className="space-y-2">
        {choices.map((choice, i) => {
          const selected = arr.includes(choice)
          return (
          <label key={i} className={choiceClass(choice)} onClick={() => toggle(choice)}>
            <input type="checkbox" checked={selected} readOnly className="accent-primary-600" />
            <span className="text-gray-800 dark:text-gray-200 flex-1">{choice}</span>
            {!showResult && <ChoiceCheck selected={selected} />}
          </label>
          )
        })}
      </div>
    )
  }

  if (type === 'true-false') {
    return (
      <div className="flex gap-4">
        {['true', 'false'].map(val => {
          const label = val === 'true' ? 'Правда' : 'Неправда'
          const selected = answer === val
          const resultClass = showResult
            ? (isCorrect(val) ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : selected ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700')
            : (selected ? 'border-primary-500 dark:border-violet-400 bg-primary-100 dark:bg-violet-600/30 dark:ring-2 dark:ring-violet-400/40 shadow-sm' : 'border-gray-200 dark:border-gray-600/80 hover:border-primary-300 dark:hover:border-violet-500/50')
          return (
            <button key={val} onClick={() => !showResult && onChange(val)}
              className={`relative flex-1 py-4 rounded-xl border-2 font-semibold text-lg transition-colors ${resultClass}`}>
              {label}
              {selected && !showResult && (
                <Check className="absolute top-2 right-2 w-5 h-5 text-primary-600 animate-check-pop" />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (type === 'open-answer') {
    return (
      <textarea
        value={(answer as string) || ''}
        onChange={e => onChange(e.target.value)}
        disabled={showResult}
        rows={4}
        placeholder="Введіть вашу відповідь..."
        className="input resize-none"
      />
    )
  }

  if (type === 'fill-blank') {
    const text = question.content
    const parts = text.split('___')
    const blanks = (options.blanks_count as number) || parts.length - 1
    const answerArr = (answer as string[]) || Array(blanks).fill('')
    return (
      <div className="leading-loose text-gray-800 dark:text-gray-200">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                value={answerArr[i] || ''}
                onChange={e => {
                  if (showResult) return
                  const next = [...answerArr]
                  next[i] = e.target.value
                  onChange(next)
                }}
                disabled={showResult}
                className="inline-block mx-1 px-2 py-0.5 border-b-2 border-primary-400 bg-transparent focus:outline-none focus:border-primary-600 min-w-[80px] text-center"
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  if (type === 'ordering') {
    return <OrderingQuestion question={question} answer={answer} onChange={onChange} showResult={showResult} correctAnswer={correctAnswer} />
  }

  if (type === 'matching') {
    return <MatchingQuestion question={question} answer={answer} onChange={onChange} showResult={showResult} correctAnswer={correctAnswer} />
  }

  return <div className="text-gray-500">Невідомий тип питання: {type}</div>
}

function SortableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-grab select-none">
      <GripVertical className="w-4 h-4 text-gray-400" {...attributes} {...listeners} />
      <span>{label}</span>
    </div>
  )
}

function OrderingQuestion({ question, answer, onChange, showResult, correctAnswer }: Props) {
  const choices = (question.options.choices as string[]) || []
  const items = (answer as string[])?.length ? (answer as string[]) : choices
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = items.indexOf(active.id as string)
      const newIdx = items.indexOf(over.id as string)
      onChange(arrayMove(items, oldIdx, newIdx))
    }
  }

  if (showResult) {
    return (
      <div className="space-y-2">
        {(correctAnswer as string[])?.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${items[i] === item ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'}`}>
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, i) => (
            <SortableItem key={item} id={item} label={`${i + 1}. ${item}`} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function MatchingQuestion({ question, answer, onChange, showResult, correctAnswer }: Props) {
  const left = (question.options.left as string[]) || []
  const right = (question.options.right as string[]) || []
  const current = (answer as Record<string, string>) || {}
  const correct = (correctAnswer as Record<string, string>) || {}

  return (
    <div className="space-y-3">
      {left.map(leftItem => (
        <div key={leftItem} className="flex items-center gap-3">
          <div className="flex-1 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm font-medium">{leftItem}</div>
          <span className="text-gray-400">→</span>
          <select
            value={current[leftItem] || ''}
            onChange={e => !showResult && onChange({ ...current, [leftItem]: e.target.value })}
            disabled={showResult}
            className="flex-1 input text-sm"
          >
            <option value="">Оберіть...</option>
            {right.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {showResult && (
            <span className={current[leftItem] === correct[leftItem] ? 'text-green-500' : 'text-red-500'}>
              {current[leftItem] === correct[leftItem] ? '✓' : '✗'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
