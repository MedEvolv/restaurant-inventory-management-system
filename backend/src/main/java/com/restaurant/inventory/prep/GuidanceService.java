package com.restaurant.inventory.prep;

import com.fasterxml.jackson.core.type.TypeReference;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static com.restaurant.inventory.prep.PrepStockService.*;

@Service
public class GuidanceService {
    private static final List<String> FIELDS=List.of("title","owner","method","handling","substitutions","portionNote","applicability","nextAction","sourceReference");
    private final PrepStockService stock; private final JdbcTemplate db; private final PlanningService planning;
    public GuidanceService(PrepStockService stock,PlanningService planning) { this.stock=stock; this.db=stock.database(); this.planning=planning; }

    @Transactional public Map<String,Object> create(Map<String,Object> body) {
        var content=normalize(body,null); long recipe=((Number)content.get("recipeId")).longValue(); activeRecipe(recipe); content.put("recipeFingerprint",fingerprint(recipe));
        long id=stock.insert("INSERT INTO guidance_documents(recipe_id,draft_version,draft_json,updated_at) VALUES(?,1,?,?)",recipe,encode(content),stock.now()); return document(id);
    }
    @Transactional public Map<String,Object> update(long id,Map<String,Object> body) {
        var row=locked(id); int version=expected(body),current=((Number)row.get("draft_version")).intValue(); if(version!=current)throw conflict("Draft version is stale.");
        long recipe=((Number)row.get("recipe_id")).longValue(); var previous=decode((String)row.get("draft_json")); var content=normalize(body,recipe,previous); activeRecipe(recipe); content.put("recipeFingerprint",fingerprint(recipe));
        db.update("UPDATE guidance_documents SET draft_version=?,draft_json=?,updated_at=? WHERE id=?",current+1,encode(content),stock.now(),id); return document(id);
    }
    @Transactional public Map<String,Object> publish(long id,Map<String,Object> body) {
        var row=locked(id); int version=expected(body),current=((Number)row.get("draft_version")).intValue(); if(version!=current)throw conflict("Draft version is stale.");
        long recipe=((Number)row.get("recipe_id")).longValue(); var content=decode((String)row.get("draft_json")); activeRecipe(recipe);
        if(content.get("recipeFingerprint")==null||!Objects.equals(content.get("recipeFingerprint"),fingerprint(recipe)))throw conflict("Recipe changed; save a reviewed draft before publishing.");
        List<String> reviewed=reviewedLanguages(body);
        Integer already=(Integer)row.get("published_version"); if(already!=null&&already==current) {
            var prior=decode((String)row.get("published_json"));
            if(!new HashSet<>(availableLanguages(prior)).equals(new HashSet<>(reviewed)))throw conflict("This draft version was already published with a different reviewed language set; save the draft before changing it.");
            return document(id);
        }
        var contents=new LinkedHashMap<String,Map<String,Object>>();
        for(String language:reviewed) {
            Map<String,Object> source=language.equals("hi")?content:englishDraft(content);
            for(String field:List.of("title","method","applicability","nextAction"))if(!nonblank(source.get(field)))throw new IllegalArgumentException(field+" is required for "+language+" publication.");
            contents.put(language,languageContent(source));
        }
        content.remove("translations");
        content.put("availableLanguages",reviewed);
        content.put("languageContents",contents);
        if(!reviewed.contains("hi"))for(String field:List.of("method","handling","substitutions","portionNote","applicability","nextAction"))content.remove(field);
        content.put("photos",photoList(id,false)); for(var p:(List<Map<String,Object>>)content.get("photos"))p.put("url","/api/prep/guidance/photos/"+p.get("id"));
        var at=stock.now(); String snapshot=encode(content); db.update("INSERT INTO guidance_publications(document_id,version,content_json,published_at) VALUES(?,?,?,?)",id,current,snapshot,at);
        db.update("UPDATE guidance_documents SET published_version=?,published_json=?,published_at=?,updated_at=? WHERE id=?",current,snapshot,at,at,id); return document(id);
    }
    @Transactional(readOnly=true) public Map<String,Object> document(long id) { return shape(oneDoc(id)); }
    @Transactional(readOnly=true) public List<Map<String,Object>> documents() { return db.queryForList("SELECT id FROM guidance_documents ORDER BY updated_at DESC,id DESC").stream().map(r->document(((Number)r.get("id")).longValue())).toList(); }
    @Transactional(readOnly=true) public List<Map<String,Object>> published(Long recipeId) { return published(recipeId,"hi"); }
    @Transactional(readOnly=true) public List<Map<String,Object>> published(Long recipeId,String requestedLanguage) {
        String language=checkedLanguage(requestedLanguage);
        String sql="SELECT id FROM guidance_documents WHERE published_json IS NOT NULL"+(recipeId==null?"":" AND recipe_id=?")+" ORDER BY published_at DESC,id DESC";
        return (recipeId==null?db.queryForList(sql):db.queryForList(sql,recipeId)).stream().map(r->publishedShape(oneDoc(((Number)r.get("id")).longValue()),language)).toList();
    }
    private Map<String,Object> publishedShape(Map<String,Object> row) { return publishedShape(row,"hi"); }
    private Map<String,Object> publishedShape(Map<String,Object> row,String requestedLanguage) {
        long rid=((Number)row.get("recipe_id")).longValue(); var content=decode((String)row.get("published_json"));
        List<String> available=availableLanguages(content);
        if(!matches(content,rid))return map("id",row.get("id"),"recipeId",rid,"title",content.get("title"),"owner",content.get("owner"),"isDemo",content.get("isDemo"),"version",row.get("published_version"),"publishedAt",row.get("published_at").toString(),"stale",true,"reason","Recipe changed; manager review needed.","requestedLanguage",requestedLanguage,"contentLanguage",null,"availableLanguages",available,"languageFallback",false);
        Map<String,Map<String,Object>> variants=languageContents(content);
        String selected=available.contains(requestedLanguage)?requestedLanguage:(available.contains("hi")?"hi":"en");
        var result=new LinkedHashMap<String,Object>(content);
        for(String field:List.of("title","method","handling","substitutions","portionNote","applicability","nextAction","translations"))result.remove(field);
        result.putAll(variants.get(selected));
        result.put("languageContents",variants);result.put("availableLanguages",available);result.put("requestedLanguage",requestedLanguage);result.put("contentLanguage",selected);result.put("languageFallback",!requestedLanguage.equals(selected));
        result.put("id",row.get("id"));result.put("recipeId",rid);result.put("recipeName",row.get("recipe_name"));result.put("version",row.get("published_version"));result.put("publishedAt",row.get("published_at").toString());result.put("stale",false);return result;
    }
    @Transactional(readOnly=true) public Map<String,Object> today(String dateText) { return today(dateText,"hi"); }
    @Transactional(readOnly=true) public Map<String,Object> today(String dateText,String requestedLanguage) {
        String language=checkedLanguage(requestedLanguage);
        LocalDate date=stock.date(dateText); var dishes=new ArrayList<Map<String,Object>>(); var mealTimes=planning.mealTimes(date);
        for(var plan:db.queryForList("SELECT p.id,p.recipe_id,p.portions,p.meal_slot,r.name FROM meal_plans p JOIN prep_recipes r ON r.id=p.recipe_id WHERE p.meal_date=? ORDER BY p.id",date)) {
            long planId=((Number)plan.get("id")).longValue(),recipeId=((Number)plan.get("recipe_id")).longValue(); BigDecimal portions=new BigDecimal(plan.get("portions").toString());
            String mealSlot=(String)plan.get("meal_slot");
            var quantities=db.queryForList("SELECT ri.inventory_id,ri.quantity_base,ri.input_unit,i.name FROM recipe_ingredients ri JOIN inventory_items i ON i.id=ri.inventory_id WHERE ri.recipe_id=? ORDER BY ri.inventory_id",recipeId).stream().map(line->{BigDecimal per=Units.fromBase((BigDecimal)line.get("quantity_base"),(String)line.get("input_unit"));return map("ingredientId",line.get("inventory_id"),"name",line.get("name"),"perServing",Units.text(per),"required",Units.text(per.multiply(portions)),"unit",line.get("input_unit"));}).toList();
            var guides=db.queryForList("SELECT d.*,r.name recipe_name FROM guidance_documents d JOIN prep_recipes r ON r.id=d.recipe_id WHERE d.recipe_id=? AND published_json IS NOT NULL ORDER BY published_at DESC,id DESC",recipeId).stream().map(row->publishedShape(row,language)).toList();
            dishes.add(map("planId",planId,"recipeId",recipeId,"name",plan.get("name"),"portions",plan.get("portions"),"mealSlot",mealSlot,"serveTime",mealSlot.equals("UNASSIGNED")?null:mealTimes.get(mealSlot),"quantities",quantities,"guidance",guides));
        } return map("date",dateText,"mealTimes",mealTimes,"dishes",dishes);
    }
    private boolean matches(Map<String,Object> content,long recipe) { return content.get("recipeFingerprint")!=null&&Objects.equals(content.get("recipeFingerprint"),fingerprint(recipe)); }
    private String fingerprint(long id) { var recipe=planning.recipe(id); var ingredients=new ArrayList<>((List<Map<String,Object>>)recipe.get("ingredients")); ingredients.sort(Comparator.comparing(x->((Number)x.get("ingredientId")).longValue())); var normalized=new ArrayList<Map<String,Object>>(); for(var x:ingredients)normalized.add(map("ingredientId",x.get("ingredientId"),"ingredientName",x.get("name"),"perServing",x.get("quantity"),"unit",x.get("unit"))); return stock.hash(map("name",recipe.get("name"),"active",recipe.get("active"),"ingredients",normalized)); }
    private Map<String,Object> normalize(Map<String,Object> body,Long immutableRecipe) { return normalize(body,immutableRecipe,null); }
    private Map<String,Object> normalize(Map<String,Object> body,Long immutableRecipe,Map<String,Object> previous) {
        long recipe=id(body,"recipeId");if(immutableRecipe!=null&&recipe!=immutableRecipe)throw new IllegalArgumentException("recipeId cannot be changed.");if(!(body.get("isDemo") instanceof Boolean))throw new IllegalArgumentException("isDemo must be a boolean.");
        var result=map("recipeId",recipe,"isDemo",body.get("isDemo"));for(String field:FIELDS)result.put(field,field.equals("title")||field.equals("owner")?required(body,field,120):optional(body,field,field.equals("sourceReference")?1000:field.equals("method")?8000:4000));
        Object incoming=body.get("translations");
        if(incoming==null){if(previous!=null&&previous.containsKey("translations"))result.put("translations",previous.get("translations"));return result;}
        if(!(incoming instanceof Map<?,?> raw))throw new IllegalArgumentException("translations must be an object.");
        for(Object key:raw.keySet())if(!"en".equals(key))throw new IllegalArgumentException("Only en translations are supported.");
        Object en=raw.get("en"); if(en==null){if(raw.containsKey("en"))return result;throw new IllegalArgumentException("translations must contain en.");}
        if(!(en instanceof Map<?,?> fields))throw new IllegalArgumentException("translations.en must be an object or null.");
        var english=new LinkedHashMap<String,Object>(); if(previous!=null&&previous.get("translations") instanceof Map<?,?> old&&old.get("en") instanceof Map<?,?> oldEn)for(String field:List.of("title","method","handling","substitutions","portionNote","applicability","nextAction"))if(oldEn.containsKey(field))english.put(field,oldEn.get(field));
        for(Object key:fields.keySet())if(!List.of("title","method","handling","substitutions","portionNote","applicability","nextAction").contains(key))throw new IllegalArgumentException("Unsupported English translation field: "+key);
        for(var entry:fields.entrySet()){String field=(String)entry.getKey();Object value=entry.getValue();if(value!=null&&!(value instanceof String))throw new IllegalArgumentException("translations.en."+field+" must be a string.");if(value==null){english.remove(field);continue;}int limit=field.equals("title")?120:field.equals("method")?8000:4000;String text=((String)value).trim();if(text.length()>limit)throw new IllegalArgumentException("translations.en."+field+" exceeds "+limit+" characters.");english.put(field,text);}
        result.put("translations",map("en",english));return result;
    }
    private boolean nonblank(Object value){return value instanceof String s&&!s.isBlank();}
    private Map<String,Object> englishDraft(Map<String,Object> content){Object translations=content.get("translations");if(translations instanceof Map<?,?> t&&t.get("en") instanceof Map<?,?> e){var out=new LinkedHashMap<String,Object>();for(String field:List.of("title","method","handling","substitutions","portionNote","applicability","nextAction"))if(e.containsKey(field))out.put(field,e.get(field));return out;}return Map.of();}
    private Map<String,Object> languageContent(Map<String,Object> source){var out=new LinkedHashMap<String,Object>();for(String field:List.of("title","method","handling","substitutions","portionNote","applicability","nextAction"))if(source.containsKey(field))out.put(field,source.get(field));return out;}
    private Map<String,Map<String,Object>> languageContents(Map<String,Object> snapshot){var result=new LinkedHashMap<String,Map<String,Object>>();Object stored=snapshot.get("languageContents");if(stored instanceof Map<?,?> variants){for(String language:List.of("hi","en"))if(variants.get(language) instanceof Map<?,?> v){var copy=new LinkedHashMap<String,Object>();for(String field:List.of("title","method","handling","substitutions","portionNote","applicability","nextAction"))if(v.containsKey(field))copy.put(field,v.get(field));result.put(language,copy);}}else result.put("hi",languageContent(snapshot));return result;}
    private List<String> availableLanguages(Map<String,Object> snapshot){Object languages=snapshot.get("availableLanguages");if(languages instanceof List<?> list){var result=new ArrayList<String>();for(Object language:list)if(("hi".equals(language)||"en".equals(language))&&!result.contains(language))result.add((String)language);if(!result.isEmpty())return result;}return List.of("hi");}
    private List<String> reviewedLanguages(Map<String,Object> body){Object value=body.get("reviewedLanguages");if(value==null&&!body.containsKey("reviewedLanguages"))return List.of("hi");if(!(value instanceof List<?> list)||list.isEmpty())throw new IllegalArgumentException("reviewedLanguages must be a nonempty array containing hi and/or en.");var result=new ArrayList<String>();for(Object item:list){if(!(item instanceof String s)||!List.of("hi","en").contains(s)||result.contains(s))throw new IllegalArgumentException("reviewedLanguages must contain unique hi/en values only.");result.add(s);}return result;}
    private String checkedLanguage(String language){if(!List.of("hi","en").contains(language))throw new IllegalArgumentException("language must be hi or en.");return language;}
    private Map<String,Object> shape(Map<String,Object> row) {
        long id=((Number)row.get("id")).longValue();var draft=decode((String)row.get("draft_json"));draft.put("photos",photoList(id,true));boolean draftChanged=!matches(draft,((Number)row.get("recipe_id")).longValue());Integer pub=(Integer)row.get("published_version");Object pubAt=row.get("published_at");
        var result=map("id",id,"recipeId",row.get("recipe_id"),"recipeName",row.get("recipe_name"),"draftVersion",row.get("draft_version"),"publishedVersion",pub,"publishedAt",pubAt==null?null:pubAt.toString(),"updatedAt",row.get("updated_at").toString(),"draft",draft,"draftRecipeChanged",draftChanged,"recipeChanged",pub!=null&&!matches(decode((String)row.get("published_json")),((Number)row.get("recipe_id")).longValue()),"published",null);
        if(pub!=null){var content=decode((String)row.get("published_json"));content.put("version",pub);content.put("publishedAt",pubAt.toString());content.put("stale",!matches(content,((Number)row.get("recipe_id")).longValue()));result.put("published",content);}return result;
    }
    @Transactional public Map<String,Object> upload(long id,MultipartFile file,String caption,String kind,boolean demo,int expectedVersion) {
        var row=locked(id);int current=((Number)row.get("draft_version")).intValue();if(expectedVersion<1)throw new IllegalArgumentException("expectedVersion must be a positive integer.");if(expectedVersion!=current)throw conflict("Draft version is stale.");if(file==null||file.isEmpty())throw new IllegalArgumentException("Image is empty.");if(file.getSize()>5*1024*1024)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"Image exceeds 5 MB.");if(!Set.of("PROCESS","PORTION").contains(kind))throw new IllegalArgumentException("kind must be PROCESS or PORTION.");if(caption==null||caption.trim().isEmpty()||caption.trim().length()>240)throw new IllegalArgumentException("Caption is required and must be 240 characters or fewer.");if(db.queryForObject("SELECT COUNT(*) FROM guidance_photos WHERE document_id=? AND deleted_at IS NULL",Integer.class,id)>=6)throw new IllegalArgumentException("A draft can have at most six photos.");
        byte[] bytes;try{bytes=file.getBytes();}catch(Exception e){throw new IllegalArgumentException("Unable to read image.");}String type=validateImage(bytes,file.getContentType());
        stock.insert("INSERT INTO guidance_photos(document_id,content_type,photo_bytes,caption,kind,is_demo,created_at) VALUES(?,?,?,?,?,?,?)",id,type,bytes,caption.trim(),kind,demo,stock.now());bumpDraft(id,current);return document(id);
    }
    private String validateImage(byte[] bytes,String submitted) {
        try { String magic=bytes.length>3&&bytes[0]==(byte)0x89&&bytes[1]=='P'&&bytes[2]=='N'&&bytes[3]=='G'?"image/png":bytes.length>2&&bytes[0]==(byte)0xff&&bytes[1]==(byte)0xd8&&bytes[2]==(byte)0xff?"image/jpeg":null;if(magic==null||!magic.equalsIgnoreCase(submitted))throw new IllegalArgumentException("Upload a valid JPEG or PNG with a matching content type.");
            try(ImageInputStream in=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))){Iterator<ImageReader> readers=ImageIO.getImageReaders(in);if(!readers.hasNext())throw new IllegalArgumentException("Image is corrupt.");ImageReader reader=readers.next();try{reader.setInput(in,true,true);int w=reader.getWidth(0),h=reader.getHeight(0);if(w<1||h<1||w>6000||h>6000||(long)w*h>20_000_000L)throw new IllegalArgumentException("Image dimensions exceed limits.");if(reader.read(0)==null)throw new IllegalArgumentException("Image is corrupt.");}finally{reader.dispose();}}return magic;
        }catch(IllegalArgumentException e){throw e;}catch(Exception e){throw new IllegalArgumentException("Image is corrupt.");}
    }
    @Transactional public void removePhoto(long doc,long photo,int expected) { var row=locked(doc);int v=((Number)row.get("draft_version")).intValue();if(v!=expected)throw conflict("Draft version is stale.");int removed=db.update("UPDATE guidance_photos SET deleted_at=? WHERE id=? AND document_id=? AND deleted_at IS NULL",stock.now(),photo,doc);if(removed==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Photo not found.");bumpDraft(doc,v); }
    private void bumpDraft(long id,int version){var row=locked(id);var draft=decode((String)row.get("draft_json"));db.update("UPDATE guidance_documents SET draft_version=?,draft_json=?,updated_at=? WHERE id=?",version+1,encode(draft),stock.now(),id);}
    @Transactional(readOnly=true) public List<Map<String,Object>> photos(long id,boolean manager){return photoList(id,manager);}
    private List<Map<String,Object>> photoList(long id,boolean manager){String path=manager?"/api/prep/guidance/"+id+"/photos/":"/api/prep/guidance/photos/";return db.queryForList("SELECT id,caption,kind,is_demo FROM guidance_photos WHERE document_id=? AND deleted_at IS NULL ORDER BY id",id).stream().map(p->map("id",p.get("id"),"url",path+p.get("id"),"caption",p.get("caption"),"kind",p.get("kind"),"isDemo",p.get("is_demo"))).toList();}
    @Transactional(readOnly=true) public ResponseEntity<byte[]> photo(long id,Long document,boolean staff) {
        var rows=db.queryForList("SELECT id,document_id,content_type,photo_bytes FROM guidance_photos WHERE id=?"+(document==null?"":" AND document_id=?"),document==null?new Object[]{id}:new Object[]{id,document});if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Photo not found.");var r=rows.getFirst();
        if(staff){long doc=((Number)r.get("document_id")).longValue();var d=oneDoc(doc);if(d.get("published_json")==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Photo not found.");var content=decode((String)d.get("published_json"));if(!matches(content,((Number)d.get("recipe_id")).longValue())||!containsPhoto(content,id))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Photo not found.");}
        return ResponseEntity.ok().contentType(MediaType.parseMediaType((String)r.get("content_type"))).header("X-Content-Type-Options","nosniff").body((byte[])r.get("photo_bytes"));
    }
    private boolean containsPhoto(Map<String,Object> c,long id){Object ps=c.get("photos");return ps instanceof List<?> list&&list.stream().anyMatch(p->p instanceof Map<?,?> m&&Objects.toString(m.get("id"),"").equals(Long.toString(id)));}
    private Map<String,Object> oneDoc(long id){var rows=db.queryForList("SELECT d.*,r.name recipe_name FROM guidance_documents d JOIN prep_recipes r ON r.id=d.recipe_id WHERE d.id=?",id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found.");return rows.getFirst();}
    private Map<String,Object> locked(long id){var rows=db.queryForList("SELECT * FROM guidance_documents WHERE id=? FOR UPDATE",id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found.");return rows.getFirst();}
    private void activeRecipe(long id){stock.one("SELECT id FROM prep_recipes WHERE id=? AND active=1",id);}private int expected(Map<String,Object>b){Object x=b.get("expectedVersion");if(!(x instanceof Number n)||n.intValue()<1||n.doubleValue()!=n.intValue())throw new IllegalArgumentException("expectedVersion must be a positive integer.");return n.intValue();}
    private String encode(Map<String,Object>x){try{return stock.mapper().writeValueAsString(x);}catch(Exception e){throw new IllegalArgumentException("Invalid guidance content.");}}private Map<String,Object> decode(String x){try{return stock.mapper().readValue(x,new TypeReference<LinkedHashMap<String,Object>>(){});}catch(Exception e){throw new IllegalStateException("Stored guidance content is invalid.");}}
}
