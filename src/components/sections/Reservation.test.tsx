import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TextEncoder } from 'util'
import Reservation from './Reservation'

const mockTranslate = (key: string) => key

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => mockTranslate,
}))

describe('Reservation', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ slots: [] }),
    }) as jest.Mock
  })

  it('keeps contact details hidden until a table has been selected', async () => {
    render(<Reservation />)

    expect(screen.queryByLabelText('form.name_label')).not.toBeInTheDocument()
    expect(screen.getByLabelText('form.party_size_label')).toBeInTheDocument()
    expect(screen.getByText('date_label')).toBeInTheDocument()
    expect(await screen.findByText('no_slots')).toBeInTheDocument()
  })

  it('preloads availability for the next bookable date', async () => {
    render(<Reservation />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/availability\?date=\d{4}-\d{2}-\d{2}$/),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })
  })

  it('shows the availability skeleton on the initial render', async () => {
    Object.assign(global, { TextEncoder })
    const { renderToStaticMarkup } = await import('react-dom/server')
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const markup = renderToStaticMarkup(<Reservation />)
    consoleError.mockRestore()

    expect(markup).toContain('loading_slots')
    expect(markup).not.toContain('no_slots')
  })

  it('formats an English booking date without German punctuation', async () => {
    render(<Reservation />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    expect(screen.queryByText(/, \d{1,2}\. [A-Z]/)).not.toBeInTheDocument()
  })

  it('does not offer closed Mondays as bookable dates', async () => {
    render(<Reservation />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    const selectableMonday = screen.getAllByRole('button').find((button) =>
      button.getAttribute('aria-label')?.startsWith('Monday,') && !button.hasAttribute('disabled')
    )

    expect(selectableMonday).toBeUndefined()
  })

  it('reuses availability already loaded for a date', async () => {
    render(<Reservation />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    const selectedDay = screen.getByRole('button', { name: /selected/ })
    const anotherDay = screen.getAllByRole('button').find((button) => {
      const label = button.getAttribute('aria-label') ?? ''
      return !button.hasAttribute('disabled') && /^\w+, \d/.test(label) && !label.includes('selected')
    })
    expect(anotherDay).toBeDefined()

    fireEvent.click(anotherDay!)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
    fireEvent.click(selectedDay)
    await waitFor(() => expect(selectedDay.getAttribute('aria-label')).toContain('selected'))

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('refreshes cached availability after its short freshness window', async () => {
    render(<Reservation />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    const selectedDay = screen.getByRole('button', { name: /selected/ })
    const anotherDay = screen.getAllByRole('button').find((button) => {
      const label = button.getAttribute('aria-label') ?? ''
      return !button.hasAttribute('disabled') && /^\w+, \d/.test(label) && !label.includes('selected')
    })

    fireEvent.click(anotherDay!)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
    const expiredAt = Date.now() + 31_000
    const now = jest.spyOn(Date, 'now').mockReturnValue(expiredAt)
    fireEvent.click(selectedDay)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3))
    now.mockRestore()
  })

  it('opens contact details only after continuing with a selected time', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        slots: [
          {
            id: 'slot-1',
            start_time: '18:00:00',
            end_time: '20:00:00',
            max_capacity: 20,
            booked: 4,
            available: true,
          },
        ],
      }),
    })

    render(<Reservation />)
    fireEvent.click(await screen.findByRole('button', { name: '18:00 – 20:00' }))

    expect(screen.queryByLabelText('form.name_label')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    expect(screen.getByLabelText('form.name_label')).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'back' }))
    expect(screen.getByLabelText('form.party_size_label')).toHaveFocus()
  })

  it('explains when available services cannot fit the selected party', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        slots: [
          {
            id: 'slot-1',
            start_time: '18:00:00',
            end_time: '20:00:00',
            max_capacity: 20,
            booked: 19,
            available: true,
          },
        ],
      }),
    })

    render(<Reservation />)

    expect(await screen.findByText('no_slots_for_party')).toBeInTheDocument()
  })

  it('shows field errors instead of submitting incomplete contact details', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        slots: [
          {
            id: 'slot-1',
            start_time: '18:00:00',
            end_time: '20:00:00',
            max_capacity: 20,
            booked: 4,
            available: true,
          },
        ],
      }),
    })

    render(<Reservation />)
    fireEvent.click(await screen.findByRole('button', { name: '18:00 – 20:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    const submit = screen.getByRole('button', { name: 'form.submit' })
    submit.focus()
    fireEvent.click(submit)

    expect(screen.getByText('form.name_error')).toBeInTheDocument()
    expect(screen.getByText('form.email_error')).toBeInTheDocument()
    expect(screen.getByText('form.phone_error')).toBeInTheDocument()
    expect(screen.getByLabelText('form.name_label')).toHaveFocus()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows loading immediately when starting another booking', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          slots: [{
            id: 'slot-1',
            start_time: '18:00:00',
            end_time: '20:00:00',
            max_capacity: 20,
            booked: 4,
            available: true,
          }],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reservation: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ slots: [] }) })

    render(<Reservation />)
    fireEvent.click(await screen.findByRole('button', { name: '18:00 – 20:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    fireEvent.change(screen.getByLabelText('form.name_label'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('form.email_label'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('form.phone_label'), { target: { value: '1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'form.submit' }))

    fireEvent.click(await screen.findByRole('button', { name: 'success_book_another' }))
    expect(screen.getByText('loading_slots')).toBeInTheDocument()
    expect(screen.queryByText('no_slots')).not.toBeInTheDocument()
    expect(await screen.findByText('no_slots')).toBeInTheDocument()
  })

  it('refreshes availability and returns to time selection after a capacity conflict', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          slots: [{
            id: 'slot-1',
            start_time: '18:00:00',
            end_time: '20:00:00',
            max_capacity: 20,
            booked: 4,
            available: true,
          }],
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ slots: [] }) })

    render(<Reservation />)
    fireEvent.click(await screen.findByRole('button', { name: '18:00 – 20:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    fireEvent.change(screen.getByLabelText('form.name_label'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('form.email_label'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('form.phone_label'), { target: { value: '1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'form.submit' }))

    expect(await screen.findByText('error_slot_full')).toBeInTheDocument()
    expect(screen.getByLabelText('form.party_size_label')).toBeInTheDocument()
    expect(await screen.findByText('no_slots')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
