export type Slot = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked: number
  available: boolean
}

type Props = {
  slots: Slot[]
  selected: string | null
  onSelect: (id: string) => void
}

export default function TimeSlotPicker({ slots, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {slots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => slot.available && onSelect(slot.id)}
          disabled={!slot.available}
          aria-pressed={selected === slot.id}
          className={`px-5 py-3 text-xs tracking-widest uppercase border transition-colors ${
            !slot.available
              ? 'border-sand text-sand cursor-not-allowed'
              : selected === slot.id
              ? 'border-gold bg-gold text-ivory'
              : 'border-charcoal text-charcoal hover:border-gold hover:text-gold'
          }`}
        >
          {slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}
        </button>
      ))}
    </div>
  )
}
