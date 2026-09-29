import { afterEach,describe,it,expect,vi } from 'vitest'
import { cleanup,render,screen,waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrepApp from './PrepApp'
import { LANGUAGE_KEY,readLanguage } from './language'

vi.mock('./api',()=>({api:{get:vi.fn(path=>Promise.resolve(path==='/today'?{dishes:[]}:[])),post:vi.fn()},kitchenDate:()=> '2026-09-28'}))
afterEach(()=>{cleanup();localStorage.clear();document.documentElement.lang='';vi.restoreAllMocks()})

describe('persistent interface language',()=>{
 it('defaults safely to Hindi, persists English across a remount, and updates the document language',async()=>{
  localStorage.setItem(LANGUAGE_KEY,'unsupported');expect(readLanguage()).toBe('hi')
  const user=userEvent.setup();const view=render(<PrepApp/>);await waitFor(()=>expect(document.documentElement.lang).toBe('hi'))
  expect(screen.getByRole('button',{name:'हिन्दी'})).toHaveAttribute('aria-pressed','true')
  await user.click(screen.getByRole('button',{name:'English'}));await waitFor(()=>expect(document.documentElement.lang).toBe('en'))
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');expect(await screen.findByText('No dishes are planned for this date.')).toBeInTheDocument()
  view.unmount();render(<PrepApp/>);await waitFor(()=>expect(document.documentElement.lang).toBe('en'));expect(screen.getByRole('button',{name:'English'})).toHaveAttribute('aria-pressed','true')
 })
 it('falls back safely when browser storage reads and writes are denied',async()=>{
  const get=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('denied')}),set=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('denied')});const user=userEvent.setup();render(<PrepApp/>);await waitFor(()=>expect(document.documentElement.lang).toBe('hi'));await user.click(screen.getByRole('button',{name:'English'}));await waitFor(()=>expect(document.documentElement.lang).toBe('en'));expect(get).toHaveBeenCalled();expect(set).toHaveBeenCalled()
 })
})
