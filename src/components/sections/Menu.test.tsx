import { fireEvent, render, screen } from '@testing-library/react'
import Menu from './Menu'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

it('lets keyboard users navigate menu categories with arrows and Home/End', () => {
  render(<Menu />)
  const starters = screen.getByRole('tab', { name: 'categories.starters' })
  starters.focus()
  fireEvent.keyDown(starters, { key: 'ArrowRight' })
  const mains = screen.getByRole('tab', { name: 'categories.mains' })
  expect(mains).toHaveFocus()
  expect(mains).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', mains.id)
  fireEvent.keyDown(mains, { key: 'End' })
  const drinks = screen.getByRole('tab', { name: 'categories.drinks' })
  expect(drinks).toHaveFocus()
  fireEvent.keyDown(drinks, { key: 'ArrowRight' })
  expect(starters).toHaveFocus()
  fireEvent.keyDown(starters, { key: 'ArrowLeft' })
  expect(drinks).toHaveFocus()
  fireEvent.keyDown(drinks, { key: 'Home' })
  expect(starters).toHaveFocus()
  expect(mains).toHaveAttribute('tabindex', '-1')
})
