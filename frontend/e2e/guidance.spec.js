import { test,expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

test.beforeEach(({},testInfo)=>expect(testInfo.project.use.baseURL).toBe('http://127.0.0.1:3017'))
async function openGuide(page,name){await page.getByRole('tab',{name:'Guides',exact:true}).click();const back=page.getByRole('button',{name:'Back to guides',exact:true});if(await back.isVisible())await back.click();await page.locator('.compact-row').filter({hasText:name}).getByRole('button',{name:'Open',exact:true}).click()}

test('staff and manager complete the published guidance review loop',async({page,request},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const api=async(method,path,body,expected)=>{const response=await request[method](path,body===undefined?{}:{data:body});expect(response.status(),`${method.toUpperCase()} ${path}`).toBe(expected);const raw=await response.text();return raw?JSON.parse(raw):null}
  const stamp=randomUUID().slice(0,8),ingredientName=`डेमो सामग्री ${stamp}`,recipeName=`काल्पनिक व्यंजन ${stamp}`,today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  let ingredientId,recipeId,planId
  try{
    const ingredient=await api('post','/api/prep/ingredients',{name:ingredientName,unit:'kg'},201);ingredientId=ingredient.id
    const recipe=await api('post','/api/prep/recipes',{name:recipeName,ingredients:[{ingredientId,quantity:'0.125',unit:'kg'}]},201);recipeId=recipe.id
    const plan=await api('post','/api/prep/plans',{recipeId,date:today,portions:3},201);planId=plan.id
    const todayData=await api('get',`/api/prep/today?date=${today}`,undefined,200),dish=todayData.dishes.find(item=>item.recipeId===recipeId)
    expect(dish.quantities[0].required).toBe('0.375')
    expect(await api('get',`/api/prep/guidance/published?recipeId=${recipeId}`,undefined,200)).toHaveLength(0)

    await page.goto('/');await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Manager workspace'}).click();await page.getByRole('button',{name:'Guides',exact:true}).click()
    await page.getByRole('button',{name:'New guide',exact:true}).click();await page.getByRole('combobox',{name:'Recipe',exact:true}).selectOption(String(recipeId))
    await page.getByLabel('Hindi document title (required)').fill('काल्पनिक तैयारी मार्गदर्शन')
    await page.getByLabel('Responsible person').fill('डेमो रसोई प्रमुख')
    await page.getByLabel('Method / ordered instructions').fill('काल्पनिक उदाहरण: रसोई प्रमुख से विधि की पुष्टि करें।')
    await page.getByLabel('When this applies').fill('केवल इस काल्पनिक व्यंजन के प्रदर्शन के लिए।')
    await page.getByLabel('Next step').fill('जिम्मेदार व्यक्ति से सीधे पूछें।')
    await page.getByRole('button',{name:'Save draft'}).click();await expect(page.getByRole('status')).toContainText('Draft saved')
    let docs=await api('get',`/api/prep/guidance/published?recipeId=${recipeId}`,undefined,200);expect(docs).toHaveLength(0)
    const fixture=await readFile(resolve(process.cwd(),'../assets/demo-paneer-photo.png'));expect(fixture.byteLength).toBeGreaterThan(2_500_000)
    await page.locator('summary').filter({hasText:'Guidance photos'}).click();await page.getByLabel('Photo',{exact:true}).setInputFiles({name:'demo-paneer-photo.png',mimeType:'image/png',buffer:fixture})
    await page.getByLabel('Caption').fill('AI-generated fictional portion example')
    await page.getByLabel('Type').selectOption('PORTION')
    await page.getByRole('button',{name:'Add photo to draft'}).click();await expect(page.getByText('Photo added to draft.')).toBeVisible()
    const managerDoc=await api('get',`/api/prep/guidance/${(await api('get','/api/prep/guidance',undefined,200)).find(doc=>doc.recipeId===recipeId).id}`,undefined,200)
    expect(managerDoc.draftVersion).toBe(2);expect(managerDoc.draft.photos).toHaveLength(1)
    const preview=page.locator('.guidance-photo img');await expect(preview).toBeVisible();await expect.poll(()=>preview.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0)
    await page.getByRole('checkbox',{name:'Hindi review complete'}).check()
    await page.getByRole('button',{name:'Publish reviewed guidance'}).click();await expect(page.getByRole('status')).toContainText('Reviewed guidance published.')
    const published=(await api('get',`/api/prep/guidance/published?recipeId=${recipeId}`,undefined,200))[0];expect(published.method).toContain('रसोई प्रमुख से विधि की पुष्टि');expect(published.photos).toHaveLength(1)

    await page.getByRole('button',{name:'Staff view'}).click();await page.getByRole('button',{name:new RegExp(recipeName)}).click()
    await expect(page.locator('.published-guidance')).toContainText('The published Hindi content is shown below; it has not been translated.')
    await expect(page.locator('.published-guidance')).toContainText('काल्पनिक उदाहरण: रसोई प्रमुख से विधि की पुष्टि करें।')
    await page.getByRole('button',{name:'हिन्दी',exact:true}).click();await page.getByRole('button',{name:'English',exact:true}).click()
    await expect(page.locator('.published-guidance')).toContainText('Hindi · Reviewed languages available: Hindi')
    await page.getByRole('button',{name:'Manager workspace'}).click();await page.getByRole('button',{name:'Guides',exact:true}).click()
    await openGuide(page,recipeName)
    await page.getByRole('tab',{name:'English content'}).click();await page.getByLabel('English title').fill('Reviewed English demo guidance')
    await page.getByLabel('Method / ordered instructions').fill('Demo only: ask the kitchen lead to confirm the method.')
    await page.getByLabel('When this applies').fill('For this fictional demo dish only.')
    await page.getByLabel('Next step').fill('Ask the responsible kitchen lead directly.')
    await page.getByRole('button',{name:'Save draft'}).click();await expect(page.getByRole('status')).toContainText('Draft saved')
    await page.getByRole('checkbox',{name:'English review complete'}).check()
    await page.getByRole('button',{name:'Publish reviewed guidance'}).click();await expect(page.getByRole('status')).toContainText('Reviewed guidance published.')
    const bothPublished=(await api('get',`/api/prep/guidance/published?recipeId=${recipeId}`,undefined,200))[0];expect(bothPublished.availableLanguages).toContain('hi');expect(bothPublished.availableLanguages).toContain('en')

    await page.getByRole('button',{name:'Staff view'}).click();await expect(page.getByLabel('Work date')).toHaveValue(today);await page.getByRole('button',{name:new RegExp(recipeName)}).click()
    await expect(page.locator('.today-panel').getByText('Reviewed English demo guidance',{exact:true})).toBeVisible();await expect(page.locator('.today-panel').getByText('Demo only: ask the kitchen lead to confirm the method.',{exact:true})).toBeVisible();await expect(page.locator('.today-panel').getByText('Fictional demo content',{exact:true})).toBeVisible();await expect(page.locator('.today-panel').getByText(/version 3/)).toBeVisible();await expect(page.locator('.today-panel').getByText(/fixed total 0.375 kg/)).toBeVisible();await expect(page.locator('.today-panel').getByText('AI-generated fictional portion example',{exact:true})).toBeVisible()
    await expect.poll(()=>page.locator('.today-panel .guidance-photo img').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0)
    await page.setViewportSize(testInfo.project.name==='phone'?{width:390,height:844}:{width:1440,height:960})
    const shot=resolve(testInfo.outputDir,`${testInfo.project.name}-published-guidance.png`);await page.screenshot({path:shot,fullPage:true})
    const viewport=await page.evaluate(()=>({innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth}));expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth)

    await page.getByRole('button',{name:'Ask manager',exact:true}).click();await page.getByLabel('Your question').fill('कृपया यह काल्पनिक विधि स्पष्ट करें।');await page.getByLabel('Name').fill('डेमो कर्मचारी');await page.getByRole('button',{name:'Submit question'}).click();await expect(page.locator('form').filter({has:page.getByLabel('Your question')}).getByRole('status')).toContainText('No notification was sent')
    const queue=await api('get','/api/prep/escalations',undefined,200);const ownQuestion=queue.find(q=>q.recipeId===recipeId&&q.question==='कृपया यह काल्पनिक विधि स्पष्ट करें।');expect(ownQuestion).toBeTruthy()
    await page.getByRole('button',{name:'Manager workspace'}).click();await page.getByRole('button',{name:'Guides',exact:true}).click();await page.getByRole('tab',{name:'Questions',exact:true}).click();const questionRow=page.locator('.compact-row').filter({hasText:recipeName}).filter({hasText:ownQuestion.question});await expect(questionRow).toBeVisible();await questionRow.getByLabel('Resolution note').fill('काल्पनिक डेमो समाधान: जिम्मेदार व्यक्ति से पूछें।');await questionRow.getByRole('button',{name:'Record resolution'}).click();await expect(questionRow.getByText('काल्पनिक डेमो समाधान: जिम्मेदार व्यक्ति से पूछें।')).toBeVisible()

    await openGuide(page,recipeName);await page.getByRole('tab',{name:'English content'}).click();await page.getByLabel('English title').fill('Unpublished English title');await page.getByRole('button',{name:'Save draft'}).click();await expect(page.getByRole('status')).toContainText('Draft saved')
    const currentDoc=(await api('get','/api/prep/guidance',undefined,200)).find(doc=>doc.recipeId===recipeId);expect(currentDoc.draft.translations.en.title).toBe('Unpublished English title');expect(currentDoc.published.languageContents.en.title).toBe('Reviewed English demo guidance');expect(currentDoc.published.title).toBe('काल्पनिक तैयारी मार्गदर्शन')
    await page.getByRole('button',{name:'Staff view'}).click();await page.getByRole('button',{name:new RegExp(recipeName)}).click();await expect(page.locator('.today-panel').getByText('Reviewed English demo guidance',{exact:true})).toBeVisible();await expect(page.locator('.today-panel').getByText('Unpublished English title')).toHaveCount(0)

    await api('put',`/api/prep/recipes/${recipeId}`,{name:recipeName,ingredients:[{ingredientId,quantity:'0.250',unit:'kg'}]},200)
    await page.getByLabel('Work date').fill('2099-01-01').then(()=>page.getByLabel('Work date').fill(today));await page.getByRole('button',{name:new RegExp(recipeName)}).click();await expect(page.getByText(/recipe changed/i)).toBeVisible();await expect(page.locator('.today-panel').getByText('काल्पनिक उदाहरण: रसोई प्रमुख से विधि की पुष्टि करें।')).toHaveCount(0);await expect(page.locator('.today-panel').getByText('Demo only: ask the kitchen lead to confirm the method.')).toHaveCount(0);await expect(page.locator('.today-panel .guidance-photo img')).toHaveCount(0)
    await page.getByLabel('Work date').fill('2099-01-01');await expect(page.locator('.today-panel').getByText('No dishes are planned for this date.',{exact:true})).toBeVisible()
    expect(errors).toEqual([])
  } finally{
    if(planId)await api('delete',`/api/prep/plans/${planId}`,undefined,200)
    if(recipeId)await api('delete',`/api/prep/recipes/${recipeId}`,undefined,200)
  }
})
