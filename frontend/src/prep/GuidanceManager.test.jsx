import { describe,it,expect,vi } from 'vitest'
import { act,render,screen,waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GuidanceManager from './GuidanceManager'
import LanguageProvider from './LanguageProvider'
import { useLanguage } from './language'
const recipe={id:9,name:'Rajma',active:true,ingredients:[{ingredientId:1,name:'Rajma',quantity:'0.1',unit:'kg'}]}
const doc={id:3,recipeId:9,recipeName:'Rajma',draftVersion:1,publishedVersion:null,draft:{title:'Guide',owner:'Lead',method:'Mix gently',handling:'',substitutions:'',portionNote:'',applicability:'Rajma batch',nextAction:'Ask lead',sourceReference:'',isDemo:true,photos:[]},published:null,recipeChanged:false,draftRecipeChanged:false}
function LanguageHarness({api}){const {language,setLanguage}=useLanguage();return <><button type="button" onClick={()=>setLanguage(language==='hi'?'en':'hi')}>Toggle interface</button><GuidanceManager api={api}/></>}
describe('guidance workspace',()=>{
 it('saves a draft, enables explicit publish, and preserves dirty text while blocking photo upload',async()=>{const user=userEvent.setup(),saved={...doc,draftVersion:2,draft:{...doc.draft,title:'Guide edit'}},post=vi.fn().mockImplementation((path)=>path==='/guidance'?Promise.resolve(doc):Promise.resolve({...saved,publishedVersion:2,published:{...saved.draft,version:2}})),api={get:vi.fn(path=>Promise.resolve(path==='/recipes'?[recipe]:path==='/guidance'?[]:[])),post,put:vi.fn().mockResolvedValue(saved),upload:vi.fn()};render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'नई मार्गदर्शिका'}));await user.type(await screen.findByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)'),'Guide');await user.type(screen.getByLabelText('ज़िम्मेदार व्यक्ति'),'Lead');await user.type(screen.getByLabelText('विधि / क्रमवार निर्देश'),'Mix gently');await user.type(screen.getByLabelText('किस स्थिति में लागू'),'Rajma batch');await user.type(screen.getByLabelText('अगला कदम'),'Ask lead');await user.click(screen.getByRole('button',{name:'ड्राफ़्ट सहेजें'}));const publish=await screen.findByRole('button',{name:'समीक्षित मार्गदर्शन प्रकाशित करें'});await waitFor(()=>expect(publish).toBeEnabled());await user.click(screen.getByText('मार्गदर्शन फ़ोटो',{selector:'summary'}));const file=new File(['x'],'photo.png',{type:'image/png'});await user.upload(screen.getByLabelText('फ़ोटो'),file);await user.type(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)'),' edit');expect(screen.getByRole('button',{name:'फ़ोटो ड्राफ़्ट में जोड़ें'})).toBeDisabled();expect(publish).toBeDisabled();await user.click(screen.getByRole('button',{name:'ड्राफ़्ट सहेजें'}));await waitFor(()=>expect(publish).toBeEnabled());await user.click(publish);await waitFor(()=>expect(post).toHaveBeenCalledWith('/guidance/3/publish',{expectedVersion:2,reviewedLanguages:['hi']}));expect(api.upload).not.toHaveBeenCalled()})

it('refreshes Questions when entered and preserves a dirty guide draft',async()=>{
 const user=userEvent.setup();let queueLoads=0
 const question={id:12,recipeName:'Rajma',date:'2026-09-29',status:'OPEN',question:'Can this be prepared ahead?',reportedBy:'Kitchen lead',createdAt:'2026-09-29T08:00:00Z'}
 const api={get:vi.fn(path=>{if(path==='/recipes')return Promise.resolve([recipe]);if(path==='/guidance')return Promise.resolve([]);if(path==='/escalations'){queueLoads+=1;return Promise.resolve(queueLoads===1?[]:[question])}return Promise.resolve([])}),post:vi.fn(),put:vi.fn()}
 render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'नई मार्गदर्शिका'}))
 await user.type(await screen.findByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)'),'Unsent guide title')
 await user.click(screen.getByRole('button',{name:'मार्गदर्शिकाओं पर लौटें'}))
 await user.click(screen.getByRole('tab',{name:'प्रश्न'}))
 expect(await screen.findByText('Can this be prepared ahead?')).toBeInTheDocument();expect(api.get).toHaveBeenCalledTimes(4)
 await user.click(screen.getByRole('tab',{name:'मार्गदर्शिकाएँ'}))
 await user.click(screen.getByRole('button',{name:'इस मार्गदर्शिका का संपादन जारी रखें'}))
 expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toHaveValue('Unsent guide title')
})
})

it('blocks conflicting draft navigation and editing throughout a pending save',async()=>{
 const user=userEvent.setup();let release;const pending=new Promise(resolve=>{release=resolve});const api={get:vi.fn(path=>Promise.resolve(path==='/recipes'?[recipe]:path==='/guidance'?[doc]:path==='/guidance/3'?doc:[])),put:vi.fn().mockReturnValue(pending),post:vi.fn(),upload:vi.fn()};render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'खोलें'}));await waitFor(()=>expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toHaveValue('Guide'));await user.type(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)'),' changed');await user.click(screen.getByText('मार्गदर्शन फ़ोटो',{selector:'summary'}));await user.click(screen.getByRole('button',{name:'मार्गदर्शिकाओं पर लौटें'}));expect(screen.getByRole('button',{name:'इस मार्गदर्शिका का संपादन जारी रखें'})).toBeEnabled();await user.click(screen.getByRole('button',{name:'इस मार्गदर्शिका का संपादन जारी रखें'}));await user.click(screen.getByRole('button',{name:'बदलाव छोड़ें'}));expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toHaveValue('Guide');await user.type(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)'),' reviewed');await user.click(screen.getByRole('button',{name:'ड्राफ़्ट सहेजें'}));expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toBeDisabled();expect(screen.getByRole('button',{name:'मार्गदर्शिकाओं पर लौटें'})).toBeDisabled();expect(screen.getByLabelText('फ़ोटो')).toBeDisabled();await act(async()=>{release({...doc,draftVersion:2,draft:{...doc.draft,title:'Guide reviewed'}})});await waitFor(()=>expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toBeEnabled());expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toHaveValue('Guide reviewed');
})
it('shows the immutable archived recipe and keeps its historical guidance unavailable for editing',async()=>{
 const user=userEvent.setup();const api={get:vi.fn(path=>Promise.resolve(path==='/guidance'?[doc]:path==='/guidance/3'?doc:[])),put:vi.fn(),post:vi.fn()};render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'खोलें'}));await waitFor(()=>expect(screen.getByLabelText('व्यंजन')).toHaveValue('9'));expect(screen.getByRole('option',{name:'Rajma · निष्क्रिय'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'ड्राफ़्ट सहेजें'})).toBeDisabled();expect(screen.getByLabelText('हिन्दी दस्तावेज़ शीर्षक (आवश्यक)')).toBeDisabled();expect(screen.getByRole('button',{name:'समीक्षित मार्गदर्शन प्रकाशित करें'})).toBeDisabled();
})

it('preserves bilingual draft text through language tabs and interface changes, saves both variants, and publishes the explicit reviewed set',async()=>{
 const user=userEvent.setup()
 const oldPublication={version:1,title:'Hindi identity',owner:'Lead',availableLanguages:['hi'],languageContents:{hi:{title:'Hindi identity',method:'पुरानी विधि',applicability:'भोजन',nextAction:'परोसें'}}}
 const existing={...doc,draftVersion:1,publishedVersion:1,draft:{...doc.draft,title:'Hindi identity',translations:{en:{title:'English title'}}},published:oldPublication}
 const saved={...existing,draftVersion:2,draft:{...existing.draft,translations:{en:{title:'English title',method:'English method',applicability:'Lunch',nextAction:'Serve'}}}}
 const published={...saved,publishedVersion:2,published:{version:2,owner:'Lead',availableLanguages:['hi','en'],languageContents:{hi:{title:'Hindi identity',method:'हिन्दी विधि',applicability:'भोजन',nextAction:'परोसें'},en:{title:'English title',method:'English reviewed method',applicability:'Lunch',nextAction:'Serve'}}}}
 const api={get:vi.fn(path=>Promise.resolve(path==='/recipes'?[recipe]:path==='/guidance'?[existing]:path==='/guidance/3'?existing:[])),put:vi.fn().mockResolvedValue(saved),post:vi.fn().mockResolvedValue(published),upload:vi.fn()}
 render(<LanguageProvider><LanguageHarness api={api}/></LanguageProvider>)
 await user.click(await screen.findByRole('button',{name:'खोलें'}))
 await user.click(screen.getByRole('tab',{name:'English content'}))
 await user.clear(screen.getByLabelText('English title'));await user.type(screen.getByLabelText('English title'),'English title')
 await user.type(screen.getByLabelText('विधि / क्रमवार निर्देश'),'English method');await user.type(screen.getByLabelText('किस स्थिति में लागू'),'Lunch');await user.type(screen.getByLabelText('अगला कदम'),'Serve')
 await user.click(screen.getByRole('button',{name:'Toggle interface'}))
 expect(screen.getByLabelText('English title')).toHaveValue('English title')
 await user.click(screen.getByRole('tab',{name:'Hindi content'}));expect(screen.getByLabelText('Hindi document title (required)')).toHaveValue('Hindi identity')
 await user.click(screen.getByRole('tab',{name:'English content'}));expect(screen.getByLabelText('English title')).toHaveValue('English title')
 await user.click(screen.getByLabelText('English review complete'))
 const contentSave=screen.getAllByRole('button',{name:'Save draft'}).find(button=>button.type==='submit');expect(contentSave).toBeEnabled();await user.click(contentSave)
 await waitFor(()=>expect(api.put).toHaveBeenCalled())
 expect(api.put).toHaveBeenCalledWith('/guidance/3',expect.objectContaining({title:'Hindi identity',owner:'Lead',method:'Mix gently',translations:{en:{title:'English title',method:'English method',handling:'',substitutions:'',portionNote:'',applicability:'Lunch',nextAction:'Serve'}}}))
 const publishButton=screen.getByRole('button',{name:'Publish reviewed guidance'});await waitFor(()=>expect(publishButton).toBeEnabled());await user.click(publishButton)
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/guidance/3/publish',{expectedVersion:2,reviewedLanguages:['hi','en']}))
 expect(screen.getByText('English reviewed method')).toBeInTheDocument();expect(screen.getByText('English title:',{selector:'strong'}).parentElement).toHaveTextContent('English title: English title')
})

it('does not publish an incomplete English selection and keeps stale published history readable',async()=>{
 const user=userEvent.setup(),existing={...doc,publishedVersion:1,draftVersion:1,draft:{...doc.draft,translations:{en:{title:'Incomplete'}}},published:{version:1,title:'Legacy Hindi guide',method:'Legacy Hindi method',owner:'Lead',photos:[]}},api={get:vi.fn(path=>Promise.resolve(path==='/recipes'?[recipe]:path==='/guidance'?[existing]:path==='/guidance/3'?existing:[])),post:vi.fn(),put:vi.fn()};render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'खोलें'}));await user.click(await screen.findByText('प्रकाशित मार्गदर्शन और इतिहास'));expect((await screen.findByText(/Legacy Hindi method/)).closest('.published-language-preview')).toHaveAttribute('lang','hi');expect(screen.getByText(/प्रकाशित भाषाएँ: हिन्दी/)).toBeInTheDocument();await user.click(screen.getByLabelText(/English.*समीक्षा/));expect(screen.getByRole('button',{name:'समीक्षित मार्गदर्शन प्रकाशित करें'})).toBeDisabled();expect(screen.getByText(/अपूर्ण सामग्री प्रकाशित नहीं हो सकती/,{selector:'p'})).toBeInTheDocument()
})

it('allows republishing a refreshed draft while marking the older published snapshot stale',async()=>{
 const user=userEvent.setup(),existing={...doc,publishedVersion:1,draftVersion:2,recipeChanged:true,draftRecipeChanged:false,published:{version:1,title:'Old',owner:'Lead',availableLanguages:['hi'],languageContents:{hi:{title:'Old',method:'Old method'}}}},api={get:vi.fn(path=>Promise.resolve(path==='/recipes'?[recipe]:path==='/guidance'?[existing]:path==='/guidance/3'?existing:[])),post:vi.fn().mockResolvedValue(existing)};render(<GuidanceManager api={api}/>);await user.click(await screen.findByRole('button',{name:'खोलें'}));await user.click(await screen.findByText('प्रकाशित मार्गदर्शन और इतिहास'));const publish=await screen.findByRole('button',{name:'समीक्षित मार्गदर्शन प्रकाशित करें'});expect(publish).toBeEnabled();expect(screen.getByText(/रेसिपी बदल गई/)).toBeInTheDocument();await user.click(publish);await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/guidance/3/publish',{expectedVersion:2,reviewedLanguages:['hi']}))
})
