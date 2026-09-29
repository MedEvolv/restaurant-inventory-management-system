import {test,expect} from '@playwright/test'
import {randomUUID} from 'node:crypto'

test.beforeEach(({},testInfo)=>expect(testInfo.project.use.baseURL).toBe('http://127.0.0.1:3017'))

const kitchenDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const plusDays=(value,days)=>{const date=new Date(`${value}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10)}

test('calendar and language retain exact new portions, legacy quantity, meal times and saved totals',async({page,request},testInfo)=>{
  const stamp=randomUUID().slice(0,8),ingredientName=`Calendar ingredient ${stamp}`,recipeName=`Calendar dish ${stamp}`,date=plusDays(kitchenDate(),testInfo.project.name==='phone'?15:14)
  let ingredientId,recipeId,newPlanId
  const api=async(method,url,body,expected)=>{const response=await request[method](url,body===undefined?{}:{data:body});expect(response.status(),`${method.toUpperCase()} ${url}`).toBe(expected);const raw=await response.text();return raw?JSON.parse(raw):null}
  try{
    ingredientId=(await api('post','/api/prep/ingredients',{name:ingredientName,unit:'kg',isDemo:true},201)).id
    recipeId=(await api('post','/api/prep/recipes',{name:recipeName,ingredients:[{ingredientId,quantity:'0.125',unit:'kg'}],isDemo:true},201)).id
    await api('post','/api/prep/plans',{recipeId,date,portions:120},201)
    await page.goto('/');await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Manager workspace'}).click()
    await page.getByLabel('Choose date').fill(date)
    const lunch=page.locator('.meal-card').filter({has:page.getByRole('heading',{name:'Lunch',exact:true})})
    await lunch.getByRole('button',{name:'Add dish',exact:true}).click()
    const portions=page.getByLabel('Portions / covers');expect(await portions.locator('option').evaluateAll(options=>options.map(option=>option.value))).toEqual(['30','40','50','60','70','80','90','100'])
    await page.getByRole('combobox',{name:'Dish',exact:true}).selectOption(String(recipeId));await portions.selectOption('50');await page.getByRole('combobox',{name:'Meal',exact:true}).selectOption('LUNCH')
    await page.getByRole('button',{name:'Save planned dish',exact:true}).click();await expect(page.locator('main > [role="status"]')).toContainText('Meal plan saved')
    const savedDay=(await api('get',`/api/prep/calendar?start=${date}`,undefined,200)).days.find(day=>day.date===date)
    newPlanId=savedDay.plans.find(plan=>plan.recipeId===recipeId&&plan.portions===50)?.id
    const serveTime=savedDay.mealTimes.LUNCH==='12:45'?'12:46':'12:45'
    expect(newPlanId).toBeTruthy()
    const lunchCard=page.locator('.meal-card').filter({has:page.getByRole('heading',{name:'Lunch',exact:true})});await lunchCard.getByLabel(/Serving time.*Lunch/).fill(serveTime);await lunchCard.getByRole('button',{name:'Save time',exact:true}).click()
    await expect(page.getByText(serveTime)).toBeVisible();await page.reload();await page.getByRole('button',{name:'Manager workspace'}).click();await page.getByRole('button',{name:'Plan meals',exact:true}).click();await page.getByLabel('Choose date').fill(date)
    await expect(page.getByText(serveTime)).toBeVisible();await expect(page.getByText(recipeName,{exact:true})).toHaveCount(2)
    await page.getByRole('button',{name:'Staff view'}).click();await page.getByLabel('Work date').fill(date)
    for(const meal of ['Breakfast','Lunch','Dinner'])await expect(page.getByRole('heading',{name:meal,exact:true})).toBeVisible()
    await expect(page.getByText(`Serving time ${serveTime}`)).toBeVisible();await expect(page.getByText(new RegExp(`${recipeName}.*50 portions`))).toBeVisible();await expect(page.getByText(new RegExp(`${recipeName}.*120 portions`))).toBeVisible()
    const lunchDish=page.getByRole('button',{name:new RegExp(`${recipeName} 50 portions`)});await lunchDish.click();await expect(page.locator('.quantity-list')).toContainText('fixed total 6.25 kg');await page.getByRole('button',{name:'Back to dishes'}).click()
    const legacyDish=page.getByRole('button',{name:new RegExp(`${recipeName} 120 portions`)});await legacyDish.click();await expect(page.locator('.quantity-list')).toContainText('fixed total 15 kg');await page.getByRole('button',{name:'Back to dishes'}).click();await expect(page.getByText(/Needs a meal/)).toBeVisible()
    await page.getByRole('button',{name:'हिन्दी',exact:true}).click();await page.reload();await expect(page.getByRole('heading',{name:'नाश्ता',exact:true})).toBeVisible();await page.getByRole('button',{name:'English',exact:true}).click();await expect(page.getByRole('heading',{name:'Breakfast',exact:true})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }finally{
    if(recipeId){const ownDays=(await api('get',`/api/prep/calendar?start=${date}`,undefined,200)).days;for(const ownPlan of ownDays.flatMap(day=>day.plans).filter(plan=>plan.recipeId===recipeId))await api('delete',`/api/prep/plans/${ownPlan.id}`,undefined,200)}
    if(recipeId)await api('delete',`/api/prep/recipes/${recipeId}`,undefined,200)
  }
})
