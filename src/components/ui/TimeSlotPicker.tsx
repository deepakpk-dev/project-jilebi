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
  partySize?: number
  onSelect: (id: string) => void
}

export default function TimeSlotPicker({ slots, selected, partySize = 1, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {slots.map((slot) => {
        const canFitParty = slot.available && slot.max_capacity - slot.booked >= partySize

        return (
          <button
            type="button"
            key={slot.id}
            onClick={() => canFitParty && onSelect(slot.id)}
            disabled={!canFitParty}
            aria-pressed={selected === slot.id}
            className={`px-5 py-3 text-xs tracking-widest uppercase border transition-colors ${
            !canFitParty
              ? 'border-sand text-sand cursor-not-allowed'
              : selected === slot.id
              ? 'border-gold bg-gold text-ivory'
              : 'border-charcoal text-charcoal hover:border-gold hover:text-gold'
          }`}
          >
            {slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}
          </button>
        )
      })}
    </div>
  )
}
