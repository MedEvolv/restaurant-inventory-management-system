package com.restaurant.inventory.prep;

import java.util.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test") @Import(StockApiTest.FixedTime.class)
class GuidanceBilingualApiTest {
    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate db;
    @Autowired ObjectMapper mapper;
    final Map<String,Object> ingredients=new HashMap<>();

    Object recipe(String suffix) {
        Object ingredient=http.postForEntity("/api/prep/ingredients",Map.of("name","Bilingual "+UUID.randomUUID(),"unit","kg"),Map.class).getBody().get("id");
        Object recipe=http.postForEntity("/api/prep/recipes",Map.of("name","Dish "+suffix+" "+UUID.randomUUID(),"ingredients",List.of(Map.of("ingredientId",ingredient,"quantity","0.125","unit","kg"))),Map.class).getBody().get("id");ingredients.put(recipe.toString(),ingredient);return recipe;
    }
    Map<String,Object> draft(Object recipe) {
        var body=new LinkedHashMap<String,Object>();
        body.put("recipeId",recipe);body.put("isDemo",false);body.put("title","Hindi title");body.put("owner","Kitchen lead");
        body.put("method","Hindi method");body.put("handling","Hindi handling");body.put("substitutions","Hindi substitutes");body.put("portionNote","Hindi portion");
        body.put("applicability","Lunch");body.put("nextAction","Check the dish");body.put("sourceReference","Approved card");return body;
    }
    Map<String,Object> english() { return Map.of("title","English title","method","English method","handling","Keep covered","substitutions","Use approved alternative","portionNote","One serving","applicability","Lunch","nextAction","Check the dish"); }
    ResponseEntity<Map> update(long id,Map<String,Object> body) { return http.exchange("/api/prep/guidance/"+id,HttpMethod.PUT,new HttpEntity<>(body),Map.class); }
    ResponseEntity<Map> publish(long id,int version,List<String> languages) { return http.postForEntity("/api/prep/guidance/"+id+"/publish",Map.of("expectedVersion",version,"reviewedLanguages",languages),Map.class); }
    Map<?,?> staff(Object recipe,String language) { return (Map<?,?>)http.getForObject("/api/prep/guidance/published?recipeId="+recipe+"&language="+language,List.class).getFirst(); }
    ResponseEntity<Map> upload(long id,int version)throws Exception{
        var image=new BufferedImage(3,3,BufferedImage.TYPE_INT_RGB);var bytes=new ByteArrayOutputStream();ImageIO.write(image,"png",bytes);
        var parts=new LinkedMultiValueMap<String,Object>();var file=new ByteArrayResource(bytes.toByteArray()){@Override public String getFilename(){return "test.png";}};var fileHeaders=new HttpHeaders();fileHeaders.setContentType(MediaType.IMAGE_PNG);fileHeaders.setContentDispositionFormData("file","test.png");parts.add("file",new HttpEntity<>(file,fileHeaders));parts.add("caption","Reviewed process");parts.add("kind","PROCESS");parts.add("isDemo","false");parts.add("expectedVersion",Integer.toString(version));var headers=new HttpHeaders();headers.setContentType(MediaType.MULTIPART_FORM_DATA);return http.exchange("/api/prep/guidance/"+id+"/photos",HttpMethod.POST,new HttpEntity<>(parts,headers),Map.class);
    }

    @Test void hindiOnlyApprovalHidesEnglishDraftAndLaterEnglishSaveCannotRewriteIt() {
        Object recipe=recipe("isolation");var body=draft(recipe);body.put("translations",Map.of("en",english()));
        var created=http.postForEntity("/api/prep/guidance",body,Map.class);assertEquals(HttpStatus.CREATED,created.getStatusCode());long id=((Number)created.getBody().get("id")).longValue();
        assertEquals(HttpStatus.OK,publish(id,1,List.of("hi")).getStatusCode());
        String bytesBefore=db.queryForObject("SELECT published_json FROM guidance_documents WHERE id=?",String.class,id);
        var en=staff(recipe,"en");assertEquals("hi",en.get("contentLanguage"));assertEquals(true,en.get("languageFallback"));assertEquals(List.of("hi"),en.get("availableLanguages"));assertEquals("Hindi method",en.get("method"));assertFalse(((Map<?,?>)en.get("languageContents")).containsKey("en"));
        assertEquals(HttpStatus.CONFLICT,publish(id,1,List.of("en")).getStatusCode());
        var rawUpdate=draft(recipe);rawUpdate.put("expectedVersion",1);rawUpdate.put("translations",Map.of("en",Map.of("title","Updated English","method","Updated method","applicability","Lunch","nextAction","Serve")));
        assertEquals(HttpStatus.OK,update(id,rawUpdate).getStatusCode());
        assertEquals(bytesBefore,db.queryForObject("SELECT published_json FROM guidance_documents WHERE id=?",String.class,id));
        var revised=draft(recipe);revised.put("expectedVersion",2);revised.put("translations",Map.of("en",english()));assertEquals(HttpStatus.OK,update(id,revised).getStatusCode());
        assertEquals(HttpStatus.OK,publish(id,3,List.of("hi","en")).getStatusCode());
        var approved=staff(recipe,"en");assertEquals("en",approved.get("contentLanguage"));assertEquals(false,approved.get("languageFallback"));assertEquals("English method",approved.get("method"));assertEquals(List.of("hi","en"),approved.get("availableLanguages"));
    }

    @Test void englishPublicationRequiresCompleteReviewAndFallbackWorksInBothDirections() {
        Object recipe=recipe("fallback");var incomplete=draft(recipe);incomplete.put("translations",Map.of("en",Map.of("title","English title","method","English method","applicability","Lunch")));
        long id=((Number)http.postForEntity("/api/prep/guidance",incomplete,Map.class).getBody().get("id")).longValue();assertEquals(HttpStatus.BAD_REQUEST,publish(id,1,List.of("en")).getStatusCode());
        for(List<String> invalidSet:List.of(List.<String>of(),List.of("hi","hi"),List.of("fr")))assertEquals(HttpStatus.BAD_REQUEST,publish(id,1,invalidSet).getStatusCode());
        var invalid=draft(recipe);invalid.put("translations",Map.of("fr",Map.of("title","Titre")));assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/guidance",invalid,Map.class).getStatusCode());
        var malformed=draft(recipe);malformed.put("translations",Map.of("en",Map.of("method",12)));assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/guidance",malformed,Map.class).getStatusCode());
        assertEquals(HttpStatus.OK,publish(id,1,List.of("hi")).getStatusCode());assertEquals("hi",staff(recipe,"en").get("contentLanguage"));
        assertEquals(HttpStatus.BAD_REQUEST,http.getForEntity("/api/prep/guidance/published?recipeId="+recipe+"&language=fr",Map.class).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,http.getForEntity("/api/prep/today?date=2026-10-04&language=fr",Map.class).getStatusCode());

        Object enOnlyRecipe=recipe("english-only");var enBody=draft(enOnlyRecipe);enBody.put("translations",Map.of("en",english()));long enId=((Number)http.postForEntity("/api/prep/guidance",enBody,Map.class).getBody().get("id")).longValue();
        assertEquals(HttpStatus.OK,publish(enId,1,List.of("en")).getStatusCode());var fallback=staff(enOnlyRecipe,"hi");assertEquals("en",fallback.get("contentLanguage"));assertEquals(true,fallback.get("languageFallback"));assertEquals("English method",fallback.get("method"));
        assertFalse(fallback.containsKey("translations"));
    }

    @Test void translationOmissionPreservesAndExplicitNullRemovesEnglishDraft() {
        Object recipe=recipe("translation-preserve");var body=draft(recipe);body.put("translations",Map.of("en",english()));long id=((Number)http.postForEntity("/api/prep/guidance",body,Map.class).getBody().get("id")).longValue();
        var omitted=draft(recipe);omitted.put("expectedVersion",1);assertEquals(HttpStatus.OK,update(id,omitted).getStatusCode());
        assertEquals("English method",((Map<?,?>)((Map<?,?>)((Map<?,?>)http.getForObject("/api/prep/guidance/"+id,Map.class).get("draft")).get("translations")).get("en")).get("method"));
        var nullPreserve=draft(recipe);nullPreserve.put("expectedVersion",2);nullPreserve.put("translations",null);assertEquals(HttpStatus.OK,update(id,nullPreserve).getStatusCode());
        assertEquals("English method",((Map<?,?>)((Map<?,?>)((Map<?,?>)http.getForObject("/api/prep/guidance/"+id,Map.class).get("draft")).get("translations")).get("en")).get("method"));
        var removed=draft(recipe);removed.put("expectedVersion",3);removed.put("translations",Collections.singletonMap("en",null));assertEquals(HttpStatus.OK,update(id,removed).getStatusCode());
        assertFalse(((Map<?,?>)http.getForObject("/api/prep/guidance/"+id,Map.class).get("draft")).containsKey("translations"));
    }

    @Test void legacyHindiPublicationReadsWithoutChangingStoredJsonAndBilingualStaleSuppressesBothLanguagesAndPhotos() throws Exception {
        Object recipe=recipe("legacy");var body=draft(recipe);long id=((Number)http.postForEntity("/api/prep/guidance",body,Map.class).getBody().get("id")).longValue();
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+id+"/publish",Map.of("expectedVersion",1),Map.class).getStatusCode());
        String current=db.queryForObject("SELECT published_json FROM guidance_documents WHERE id=?",String.class,id);var legacyValue=mapper.readValue(current,new TypeReference<LinkedHashMap<String,Object>>(){});legacyValue.remove("availableLanguages");legacyValue.remove("languageContents");String legacy=mapper.writeValueAsString(legacyValue);
        db.update("UPDATE guidance_documents SET published_json=? WHERE id=?",legacy,id);db.update("UPDATE guidance_publications SET content_json=? WHERE document_id=?",legacy,id);
        var fromLegacy=staff(recipe,"en");assertEquals("hi",fromLegacy.get("contentLanguage"));assertEquals(true,fromLegacy.get("languageFallback"));assertEquals("Hindi method",fromLegacy.get("method"));
        assertEquals(legacy,db.queryForObject("SELECT published_json FROM guidance_documents WHERE id=?",String.class,id));
        assertEquals(legacy,db.queryForObject("SELECT content_json FROM guidance_publications WHERE document_id=?",String.class,id));

        Object bilingualRecipe=recipe("stale-bilingual");var bilingual=draft(bilingualRecipe);bilingual.put("translations",Map.of("en",english()));long bilingualId=((Number)http.postForEntity("/api/prep/guidance",bilingual,Map.class).getBody().get("id")).longValue();
        var uploaded=upload(bilingualId,1);assertEquals(HttpStatus.OK,uploaded.getStatusCode());long photo=((Number)((Map<?,?>)((List<?>)((Map<?,?>)uploaded.getBody().get("draft")).get("photos")).getFirst()).get("id")).longValue();assertEquals(HttpStatus.OK,publish(bilingualId,2,List.of("hi","en")).getStatusCode());
        var plan=http.postForEntity("/api/prep/plans",Map.of("recipeId",bilingualRecipe,"date","2026-10-04","portions",3),Map.class).getBody();long planId=((Number)plan.get("id")).longValue();
        assertEquals(HttpStatus.OK,http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",bilingualRecipe,"date","2026-10-05","portions",5)),Map.class).getStatusCode());
        Map<?,?> applicableToday=http.getForObject("/api/prep/today?date=2026-10-05&language=en",Map.class);Map<?,?> applicableDish=(Map<?,?>)((List<?>)applicableToday.get("dishes")).stream().filter(x->Objects.equals(((Map<?,?>)x).get("recipeId").toString(),bilingualRecipe.toString())).findFirst().orElseThrow();Map<?,?> applicableGuide=(Map<?,?>)((List<?>)applicableDish.get("guidance")).getFirst();assertEquals("en",applicableGuide.get("contentLanguage"));assertEquals("English method",applicableGuide.get("method"));assertEquals("0.625",((Map<?,?>)((List<?>)applicableDish.get("quantities")).getFirst()).get("required"));
        Object ingredient=ingredients.get(bilingualRecipe.toString());assertEquals(HttpStatus.OK,http.exchange("/api/prep/recipes/"+bilingualRecipe,HttpMethod.PUT,new HttpEntity<>(Map.of("name","Changed bilingual recipe","ingredients",List.of(Map.of("ingredientId",ingredient,"quantity","0.250","unit","kg")))),Map.class).getStatusCode());
        for(String language:List.of("hi","en")){var stale=staff(bilingualRecipe,language);assertEquals(true,stale.get("stale"));assertFalse(stale.containsKey("method"));assertFalse(stale.containsKey("languageContents"));assertFalse(stale.containsKey("photos"));}
        assertEquals(HttpStatus.NOT_FOUND,http.getForEntity("/api/prep/guidance/photos/"+photo,byte[].class).getStatusCode());
        Map<?,?> today=http.getForObject("/api/prep/today?date=2026-10-05&language=en",Map.class);Map<?,?> dish=(Map<?,?>)((List<?>)today.get("dishes")).stream().filter(x->Objects.equals(((Map<?,?>)x).get("recipeId").toString(),bilingualRecipe.toString())).findFirst().orElseThrow();Map<?,?> todayStale=(Map<?,?>)((List<?>)dish.get("guidance")).getFirst();assertEquals(true,todayStale.get("stale"));assertFalse(todayStale.containsKey("method"));assertFalse(todayStale.containsKey("languageContents"));
    }
}
