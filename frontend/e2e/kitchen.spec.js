import { test,expect } from '@playwright/test'
import path from 'node:path'
test.beforeEach(({},testInfo)=>expect(testInfo.project.use.baseURL).toBe('http://127.0.0.1:3017'))
async function managerView(page){await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Manager workspace',exact:true}).click()}
async function restoreDate(page,date){await managerView(page);await page.getByRole('button',{name:'Plan meals',exact:true}).click();await page.getByLabel('Choose date',{exact:true}).fill(date)}
async function moreView(page,name){await page.getByRole('button',{name:'More',exact:true}).click();await page.getByRole('button',{name,exact:true}).click()}
async function resetKitchen(page,mode='explore'){await page.getByRole('button',{name:'English',exact:true}).click();await moreView(page,'Ingredients & buying');await page.getByText('Demo tools',{exact:true}).click();await page.getByRole('button',{name:'Reset fictional kitchen',exact:true}).click();await page.getByLabel('Starting point').selectOption(mode);await page.getByLabel('Type RESET FICTIONAL KITCHEN').fill('RESET FICTIONAL KITCHEN');await page.getByRole('button',{name:'Reseed sample data'}).click();await expect(page.locator('main > [role="status"]')).toContainText('Fictional kitchen reset')}
async function addPlan(page,dish,portions){await page.getByRole('button',{name:'Plan meals',exact:true}).click();await page.getByRole('button',{name:'Add dish',exact:true}).first().click();await page.getByRole('combobox',{name:'Dish',exact:true}).selectOption({label:dish});await page.getByLabel('Portions / covers').selectOption(String(portions));await page.getByRole('combobox',{name:'Meal',exact:true}).selectOption('LUNCH');await page.getByRole('button',{name:'Save planned dish',exact:true}).click();await expect(page.locator('main > [role="status"]')).toContainText('Meal plan saved')}

test('manager completes receipts, planning, override, partial arrival, spoilage and guidance',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto('/');await managerView(page)
  await resetKitchen(page,'walkthrough')
  const tomorrow=await page.getByLabel('Choose date',{exact:true}).inputValue()
  const dates=await page.request.get('/api/prep/demo');const {sampleDate}=await dates.json();expect(tomorrow).toBe(sampleDate)
  await moreView(page,'Stock')
  const dateOffset=(value,offset)=>{const d=new Date(`${value}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
  async function receipt(qty,label){
    await page.getByRole('button',{name:'Receive stock',exact:true}).click()
    await page.getByRole('combobox',{name:'Ingredient',exact:true}).selectOption({label:'Tomatoes'})
    await page.getByLabel('Received quantity',{exact:true}).fill(qty)
    await page.getByLabel('Cost per received unit (₹)',{exact:true}).fill('30')
    await page.getByLabel('Supplier (optional)',{exact:true}).fill('Fictional campus supplier')
    await page.getByLabel('Label date (optional)',{exact:true}).fill(label)
    await page.getByRole('combobox',{name:'Date type',exact:true}).selectOption('BEST_BEFORE')
    await page.getByRole('button',{name:'Record receipt',exact:true}).click()
    await expect(page.locator('main > [role="status"]')).toContainText('Receipt recorded')
  }
  await receipt('7',dateOffset(tomorrow,3));await receipt('3',dateOffset(tomorrow,-2))
  const tomatoCard=page.locator('article').filter({has:page.getByRole('heading',{name:'Tomatoes',exact:true})})
  await expect(tomatoCard.locator('.quantity')).toHaveText('10 kg');await expect(tomatoCard.getByText('1 lots need date review')).toBeVisible();await tomatoCard.getByText('Show recorded lots and dates').click();await expect(tomatoCard.getByText('Review entered date')).toBeVisible()
  await page.screenshot({path:path.join(testInfo.outputDir,'05-stock.png'),fullPage:true})
  await page.reload();await restoreDate(page,tomorrow);await moreView(page,'Stock');await expect(tomatoCard.locator('.quantity')).toHaveText('10 kg')
  for(const dish of ['Vegetable pulao','Paneer curry']) await addPlan(page,dish,100)
  await moreView(page,'Ingredients & buying')
  const row=page.getByTestId('estimate-Tomatoes')
  for(const [key,value] of Object.entries({required:'15',onHand:'10',excluded:'3',usable:'7',buffer:'0',suggested:'8'}))await expect(row.getByTestId(key)).toHaveText(value)
  await page.screenshot({path:path.join(testInfo.outputDir,'01-plan.png'),fullPage:true})
  await page.getByText('Edit purchase draft',{exact:true}).click();await page.getByLabel('Draft quantity for Tomatoes',{exact:true}).fill('9');await page.getByRole('button',{name:'Save purchase draft',exact:true}).click();await expect(page.getByRole('heading',{name:'Purchase drafts',exact:true})).toBeVisible()
  await moreView(page,'Purchases');await page.getByText(/Draft #.*outstanding/).click();await expect(page.getByTestId('outstanding-Tomatoes')).toHaveText('9')
  await page.screenshot({path:path.join(testInfo.outputDir,'04-draft.png'),fullPage:true})
  await page.reload();await restoreDate(page,tomorrow);await moreView(page,'Purchases');await page.getByText(/Draft #.*outstanding/).click();await expect(page.getByTestId('outstanding-Tomatoes')).toHaveText('9')
  await page.getByRole('button',{name:/Receive Tomatoes from draft/}).click();await page.getByLabel('Received quantity',{exact:true}).fill('8');await page.getByLabel('Cost per received unit (₹)',{exact:true}).fill('30');await page.getByLabel('Label date (optional)',{exact:true}).fill(dateOffset(tomorrow,3));await page.getByRole('button',{name:'Record receipt',exact:true}).click();await expect(page.getByTestId('outstanding-Tomatoes')).toHaveText('1')
  await moreView(page,'Ingredients & buying');await expect(page.getByTestId('estimate-Tomatoes').getByTestId('usable')).toHaveText('15');await expect(page.getByTestId('estimate-Tomatoes').getByTestId('suggested')).toHaveText('0')
  await moreView(page,'Records');await page.getByRole('tab',{name:'Log stock removal'}).click();await page.getByLabel('Removal ingredient').selectOption({label:'Tomatoes'});const options=await page.getByLabel('Selected lot').locator('option').allTextContents();const eligible=options.find(x=>x.includes('7 kg'));await page.getByLabel('Selected lot').selectOption({label:eligible});await page.getByLabel('Removed quantity (kg)',{exact:true}).fill('3');await page.getByRole('combobox',{name:'Reason',exact:true}).selectOption('SPOILED');await page.getByLabel('Removal note (optional)').fill('Fictional walkthrough: damaged condition observed');await page.getByRole('button',{name:'Record stock removal'}).click();await expect(page.locator('main > [role="status"]')).toContainText('Stock removal recorded once')
  await moreView(page,'Ingredients & buying');await expect(page.getByTestId('estimate-Tomatoes').getByTestId('onHand')).toHaveText('15');await expect(page.getByTestId('estimate-Tomatoes').getByTestId('usable')).toHaveText('12');await expect(page.getByTestId('estimate-Tomatoes').getByTestId('suggested')).toHaveText('3')
  await moreView(page,'Records');await page.getByRole('tab',{name:'Manager notes'}).click();await expect(page.getByText(/Fictional manager note: keep lots separate/)).toBeVisible()
  await page.getByRole('button',{name:'Edit note for Tomatoes',exact:true}).click();await page.getByLabel('Author',{exact:true}).fill('Anita Rao (sample kitchen lead)');await page.getByRole('textbox',{name:'Guidance text',exact:true}).fill('Fictional manager note: keep lots separate; reviewed today by the sample kitchen lead.');await page.getByRole('button',{name:'Save note changes',exact:true}).click();await expect(page.locator('main > [role="status"]')).toContainText('Manager note saved')
  await page.reload();await managerView(page);await moreView(page,'Records');await page.getByRole('tab',{name:'Manager notes'}).click();await expect(page.getByText('Fictional manager note: keep lots separate; reviewed today by the sample kitchen lead.',{exact:true})).toBeVisible();await expect(page.getByText(/Last edited by Anita Rao \(sample kitchen lead\)/)).toBeVisible();await page.screenshot({path:path.join(testInfo.outputDir,'02-guidance.png'),fullPage:true});await page.getByRole('tab',{name:'Movement history'}).click();await expect(page.getByRole('cell',{name:'Spoiled',exact:false})).toBeVisible();await page.screenshot({path:path.join(testInfo.outputDir,'03-history.png'),fullPage:true})
  expect(errors).toEqual([])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('manager creates and edits a recipe, preserves legacy covers, changes purchase settings, and removes a plan',async({page,request})=>{
  await page.goto('/');await managerView(page);await resetKitchen(page)
  const date=await page.getByLabel('Choose date',{exact:true}).inputValue()
  await moreView(page,'Dishes');await page.getByRole('button',{name:'Create dish',exact:true}).click();await page.getByLabel('Dish name',{exact:true}).fill('Browser test dish');await page.getByRole('combobox',{name:'Ingredient 1',exact:true}).selectOption({label:'Tomatoes'});await page.getByLabel('Quantity',{exact:true}).fill('0.01');await page.getByRole('button',{name:'Save dish',exact:true}).click();await expect(page.locator('main > [role="status"]')).toContainText('Dish saved')
  const recipes=await (await request.get('/api/prep/recipes')).json(),recipe=recipes.find(item=>item.name==='Browser test dish')
  const legacy=await request.post('/api/prep/plans',{data:{recipeId:recipe.id,date,portions:120}});expect(legacy.status()).toBe(201)
  await page.getByRole('button',{name:'Plan meals',exact:true}).click()
  const planned=page.locator('.planned-dish').filter({hasText:'Browser test dish'})
  await planned.getByRole('button',{name:'Edit',exact:true}).click()
  const portions=page.getByLabel('Portions / covers');await expect(portions).toHaveValue('120')
  expect(await portions.locator('option').evaluateAll(options=>options.map(option=>option.value))).toEqual(['30','40','50','60','70','80','90','100','120'])
  await portions.selectOption('80');await portions.selectOption('120');await page.getByRole('combobox',{name:'Meal',exact:true}).selectOption('DINNER');await page.getByRole('button',{name:'Save planned dish',exact:true}).click()
  await moreView(page,'Ingredients & buying');const row=page.getByTestId('estimate-Tomatoes');await expect(row.getByTestId('required')).toHaveText('19.2')
  await page.getByRole('button',{name:'Plan meals',exact:true}).click();await planned.getByRole('button',{name:'Edit',exact:true}).click();await portions.selectOption('50');await page.getByRole('button',{name:'Save planned dish',exact:true}).click();await moreView(page,'Ingredients & buying');await expect(row.getByTestId('required')).toHaveText('18.5')
  await moreView(page,'Dishes');await planned.getByRole('button',{name:'Edit dish',exact:true}).click();await page.getByLabel('Quantity',{exact:true}).fill('0.02');await page.getByRole('button',{name:'Save dish',exact:true}).click();await moreView(page,'Ingredients & buying');await expect(row.getByTestId('required')).toHaveText('19')
  await page.locator('summary').filter({hasText:'Tomatoes · Show calculation and purchase settings'}).click();await page.getByLabel('Extra for Tomatoes',{exact:true}).fill('0.1');await page.getByLabel('Purchase step for Tomatoes',{exact:true}).fill('5');await page.getByRole('button',{name:'Apply settings for Tomatoes'}).click();await expect(row.getByTestId('buffer')).toHaveText('0.1');await expect(row.getByTestId('suggested')).toHaveText('15')
  await page.getByRole('button',{name:'Plan meals',exact:true}).click();await planned.getByRole('button',{name:'Remove',exact:true}).click();await moreView(page,'Ingredients & buying');await expect(row.getByTestId('required')).toHaveText('18');await moreView(page,'Dishes');await planned.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByText('Browser test dish',{exact:true})).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})
