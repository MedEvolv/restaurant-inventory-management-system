import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StockPanel from './StockPanel'
import { LanguageContext } from './language'
import { translate } from './messages'

describe('Stock receipt form', () => {
  it('lets the manager record quantity, unit cost, and an unknown date', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn(async operation => operation())
    const post = vi.fn(async () => ({}))
    function Harness(){const [language,setLanguage]=React.useState('en');return <LanguageContext.Provider value={{language,setLanguage,t:(key,values)=>translate(language,key,values)}}><button onClick={()=>setLanguage(language==='en'?'hi':'en')}>Toggle interface</button><StockPanel items={[{id: 1, name: 'Tomatoes', unit: 'kg', onHand: '7', lots: []}]} today="2026-09-28" mutate={mutate} api={{post}} /></LanguageContext.Provider>}
    const {container}=render(<Harness/>);void container
    await user.click(screen.getByRole('button', {name: 'Receive stock'}))
    await user.type(screen.getByLabelText('Received quantity'), '2.5')
    await user.type(screen.getByLabelText('Cost per received unit (₹)'), '30')
    await user.selectOptions(screen.getByLabelText('Date type'), 'UNKNOWN')
    await user.click(screen.getByRole('button',{name:'Toggle interface'}))
    expect(screen.getByLabelText('प्राप्त मात्रा')).toHaveValue(2.5)
    expect(screen.getByLabelText('प्रति प्राप्त इकाई लागत (₹)')).toHaveValue(30)
    expect(screen.getByLabelText('तारीख का प्रकार')).toHaveValue('UNKNOWN')
    await user.click(screen.getByRole('button', {name: 'रसीद दर्ज करें'}))
    expect(post).toHaveBeenCalledWith('/receipts', expect.objectContaining({ingredientId: '1', quantity: '2.5', unit: 'kg', unitCost: '30', dateType: 'UNKNOWN'}))
    expect(post.mock.calls[0][1].requestKey).toBeTruthy()
  })
})
