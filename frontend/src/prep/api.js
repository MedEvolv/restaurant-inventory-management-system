async function request(path, method = 'GET', body,attempt=0) {
  let response
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData
  try { response = await fetch(`/api/prep${path}`, {method, headers: body && !multipart ? {'Content-Type': 'application/json'} : {}, body: body ? multipart ? body : JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000)}) }
  catch(error){if(method==='GET'&&attempt<2){await new Promise(resolve=>setTimeout(resolve,150));return request(path,method,body,attempt+1)}throw error}
  if(method==='GET'&&[502,503,504].includes(response.status)&&attempt<2){await new Promise(resolve=>setTimeout(resolve,150));return request(path,method,body,attempt+1)}
  const text = await response.text()
  let result = {}
  if (text) { try { result = JSON.parse(text) } catch { throw new Error(response.ok ? 'The server returned an unreadable response. Please retry.' : 'The server returned an unreadable error. Please retry.') } }
  if (!response.ok) throw new Error(result.message || 'Could not complete this change. Please review and retry.')
  return result
}
export const api = {get: path => request(path), post: (path, body) => request(path, 'POST', body), put: (path, body) => request(path, 'PUT', body), remove: path => request(path, 'DELETE'), upload: (path, body) => request(path, 'POST', body)}
export function kitchenDate(offset = 0) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(Date.now() + offset * 86400000))
}
export const dateTypes = {USE_BY: 'Use-by', BEST_BEFORE: 'Best-before', SUPPLIER_LABEL: 'Supplier-labelled date', UNKNOWN: 'Unknown date type'}
