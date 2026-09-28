import { afterEach,expect,test,vi } from 'vitest'
import { api } from './api'
afterEach(()=>vi.unstubAllGlobals())
test('a transient gateway failure retries a read and returns the recorded balance',async()=>{
  const fetch=vi.fn().mockResolvedValueOnce(new Response('',{status:502})).mockResolvedValueOnce(new Response(JSON.stringify({onHand:'15'}),{status:200}));vi.stubGlobal('fetch',fetch)
  expect(await api.get('/ingredients/1')).toEqual({onHand:'15'});expect(fetch).toHaveBeenCalledTimes(2)
})
test('writes are not retried automatically after a gateway failure',async()=>{
  const fetch=vi.fn().mockResolvedValue(new Response('',{status:502}));vi.stubGlobal('fetch',fetch)
  await expect(api.post('/receipts',{})).rejects.toThrow('Could not complete');expect(fetch).toHaveBeenCalledTimes(1)
})
