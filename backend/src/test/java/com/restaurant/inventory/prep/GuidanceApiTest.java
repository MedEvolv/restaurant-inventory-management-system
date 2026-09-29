package com.restaurant.inventory.prep;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test") @Import(StockApiTest.FixedTime.class)
class GuidanceApiTest {
    @Autowired TestRestTemplate http;

    Object recipe() {
        var item=http.postForEntity("/api/prep/ingredients",Map.of("name","Guidance "+UUID.randomUUID(),"unit","kg"),Map.class).getBody().get("id");
        return http.postForEntity("/api/prep/recipes",Map.of("name","Guidance dish","ingredients",List.of(Map.of("ingredientId",item,"quantity","0.125","unit","kg"))),Map.class).getBody().get("id");
    }
    Map<String,Object> draft(Object rid) {
        var b=new LinkedHashMap<String,Object>(); b.put("recipeId",rid);b.put("title","Kitchen method");b.put("owner","Kitchen lead");b.put("method","Cook gently");b.put("handling","Keep covered");b.put("substitutions","None approved");b.put("portionNote","Standard portion");b.put("applicability","Lunch service");b.put("nextAction","Review after service");b.put("sourceReference","Local recipe card");b.put("isDemo",false);return b;
    }
    HttpStatusCode put(String path,Map<String,Object> body) { return http.exchange(path,HttpMethod.PUT,new HttpEntity<>(body),Map.class).getStatusCode(); }
    @Test void draftsAreInvisibleUntilPublishedAndPublicationIsImmutableAcrossDraftEdits() {
        Object rid=recipe();var body=draft(rid);var created=http.postForEntity("/api/prep/guidance",body,Map.class);assertEquals(HttpStatus.CREATED,created.getStatusCode());var doc=created.getBody();
        assertTrue(http.getForObject("/api/prep/guidance/published?recipeId="+rid,List.class).isEmpty());
        http.postForEntity("/api/prep/plans",Map.of("recipeId",rid,"date","2026-10-02","portions",3),Map.class);
        var today=http.getForObject("/api/prep/today?date=2026-10-02",Map.class);var dish=((List<Map<String,Object>>)today.get("dishes")).stream().filter(d->d.get("recipeId").toString().equals(rid.toString())).findFirst().orElseThrow();assertTrue(((List<?>)dish.get("guidance")).isEmpty());
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",1),Map.class).getStatusCode());
        today=http.getForObject("/api/prep/today?date=2026-10-02",Map.class);dish=((List<Map<String,Object>>)today.get("dishes")).stream().filter(d->d.get("recipeId").toString().equals(rid.toString())).findFirst().orElseThrow();assertEquals("0.375",((Map<?,?>)((List<?>)dish.get("quantities")).getFirst()).get("required"));assertEquals(1,((List<?>)dish.get("guidance")).size());
        body.put("expectedVersion",1);body.put("method","New method");assertEquals(HttpStatus.OK,put("/api/prep/guidance/"+doc.get("id"),body));
        assertEquals(HttpStatus.CONFLICT,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",1),Map.class).getStatusCode());
        var changedRecipe=draft(recipe());changedRecipe.put("expectedVersion",2);assertEquals(HttpStatus.BAD_REQUEST,put("/api/prep/guidance/"+doc.get("id"),changedRecipe));
        doc=http.getForObject("/api/prep/guidance/"+doc.get("id"),Map.class);assertEquals(2,doc.get("draftVersion"));assertEquals("Cook gently",((Map<?,?>)doc.get("published")).get("method"));
        assertEquals(HttpStatus.CONFLICT,put("/api/prep/guidance/"+doc.get("id"),body));
        var published=http.getForObject("/api/prep/guidance/published?recipeId="+rid,List.class);assertEquals(1,published.size());assertFalse(((Map<?,?>)published.getFirst()).containsKey("draft"));assertEquals("Cook gently",((Map<?,?>)published.getFirst()).get("method"));
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",2),Map.class).getStatusCode());
        assertEquals("New method",((Map<?,?>)http.getForObject("/api/prep/guidance/"+doc.get("id"),Map.class).get("published")).get("method"));
    }
    @Test void invalidRecipeAndIncompletePublicationAreRejectedAndRepublishIsIdempotent() {
        var body=draft(99999999);assertEquals(HttpStatus.NOT_FOUND,http.postForEntity("/api/prep/guidance",body,Map.class).getStatusCode());
        Object rid=recipe();body=draft(rid);body.put("method","");var doc=http.postForEntity("/api/prep/guidance",body,Map.class).getBody();
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",1),Map.class).getStatusCode());
        body.put("method","Ready");body.put("expectedVersion",1);assertEquals(HttpStatus.OK,put("/api/prep/guidance/"+doc.get("id"),body));
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",2),Map.class).getStatusCode());
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+doc.get("id")+"/publish",Map.of("expectedVersion",2),Map.class).getStatusCode());
        assertEquals(1,http.getForObject("/api/prep/guidance/published?recipeId="+rid,List.class).size());
        body=draft(rid);body.remove("isDemo");assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/guidance",body,Map.class).getStatusCode());
    }
    @Test void demoResetCascadesSampleGuidanceAndPreservesUnregisteredGuidance() {
        var resetBody=Map.of("confirmation","RESET FICTIONAL KITCHEN","mode","explore"); var reset=http.postForEntity("/api/prep/demo/reset",resetBody,Map.class);assertEquals(HttpStatus.OK,reset.getStatusCode()); Object rid=((List<?>)reset.getBody().get("recipes")).getFirst(),other=recipe();var first=http.postForEntity("/api/prep/guidance",draft(rid),Map.class).getBody();var second=http.postForEntity("/api/prep/guidance",draft(other),Map.class).getBody();
        assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/demo/reset",resetBody,Map.class).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND,http.getForEntity("/api/prep/guidance/"+first.get("id"),Map.class).getStatusCode());
        assertEquals(HttpStatus.OK,http.getForEntity("/api/prep/guidance/"+second.get("id"),Map.class).getStatusCode());
    }
}

