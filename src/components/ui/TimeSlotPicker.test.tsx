import { render, screen, fireEvent } from '@testing-library/react'
import TimeSlotPicker from './TimeSlotPicker'

const slots = [
  { id: '1', start_time: '18:00', end_time: '20:00', max_capacity: 20, booked: 5, available: true },
  { id: '2', start_time: '20:00', end_time: '22:00', max_capacity: 20, booked: 20, available: false },
]

describe('TimeSlotPicker', () => {
  it('renders available and unavailable slots', () => {
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={jest.fn()} />)
    expect(screen.getByText('18:00 – 20:00')).toBeInTheDocument()
    expect(screen.getByText('20:00 – 22:00')).toBeInTheDocument()
  })

  it('calls onSelect with slot id when available slot is clicked', () => {
    const onSelect = jest.fn()
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('18:00 – 20:00'))
    expect(onSelect).toHaveBeenCalledWith('1')
  })

  it('does not call onSelect when unavailable slot is clicked', () => {
    const onSelect = jest.fn()
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('20:00 – 22:00'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('disables a slot that cannot fit the selected party', () => {
    const nearlyFullSlot = [
      {
        id: '3',
        start_time: '19:00',
        end_time: '21:00',
        max_capacity: 20,
        booked: 18,
        available: true,
      },
    ]

    render(
      <TimeSlotPicker
        slots={nearlyFullSlot}
        selected={null}
        partySize={3}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '19:00 – 21:00' })).toBeDisabled()
  })
})
