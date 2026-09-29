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
test('multipart uploads keep browser boundary headers and malformed replies get a readable error',async()=>{
  const fetch=vi.fn().mockResolvedValueOnce(new Response('{bad',{status:200}));vi.stubGlobal('fetch',fetch)
  const form=new FormData();form.append('file',new Blob(['x']), 'x.png')
  await expect(api.upload('/guidance/1/photos',form)).rejects.toThrow(/unreadable response/i)
  expect(fetch.mock.calls[0][1].body).toBe(form);expect(fetch.mock.calls[0][1].headers).toEqual({})
})
