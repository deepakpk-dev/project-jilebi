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
    <div className="booking-time-slots">
      {slots.map((slot) => {
        const canFitParty = slot.available && slot.max_capacity - slot.booked >= partySize

        return (
          <button
            type="button"
            key={slot.id}
            onClick={() => canFitParty && onSelect(slot.id)}
            disabled={!canFitParty}
            aria-pressed={selected === slot.id}
            className="booking-time-slot"
          >
            <span>{slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}</span>
            <span className="booking-slot-check" aria-hidden="true">{selected === slot.id ? '✓' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}
