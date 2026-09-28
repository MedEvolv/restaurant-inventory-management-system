package com.restaurant.inventory.prep;

import java.util.*;
import java.util.concurrent.*;
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
class WorkflowApiTest {
    @Autowired TestRestTemplate http;
    Object item() { return http.postForEntity("/api/prep/ingredients",Map.of("name","Workflow "+UUID.randomUUID(),"unit","kg"),Map.class).getBody().get("id"); }
    Map<String,Object> receipt(Object id,String qty) { return new HashMap<>(Map.of("ingredientId",id,"quantity",qty,"unit","kg","unitCost","30","receivedDate","2026-09-28","dateType","UNKNOWN","requestKey",UUID.randomUUID().toString())); }
    String balance(Object id) { return (String)http.getForObject("/api/prep/ingredients/"+id,Map.class).get("onHand"); }
    Map<String,Object> setupPlan(Object id,String date) { var dish=http.postForEntity("/api/prep/recipes",Map.of("name","Workflow dish","ingredients",List.of(Map.of("ingredientId",id,"quantity","0.15","unit","kg"))),Map.class).getBody().get("id"); http.postForEntity("/api/prep/plans",Map.of("recipeId",dish,"date",date,"portions",120),Map.class); return http.getForObject("/api/prep/estimate?date="+date,Map.class); }
    @Test void draftDoesNotAddStockActualPartialReceiptDoesAndRetryIsOnce() {
        Object id=item(); http.postForEntity("/api/prep/receipts",receipt(id,"7"),Map.class);
        var estimate=setupPlan(id,"2026-10-10");
        var body=Map.of("date","2026-10-10","fingerprint",estimate.get("fingerprint"),"overrides",List.of(Map.of("ingredientId",id,"quantity","12")),"requestKey",UUID.randomUUID().toString());
        var saved=http.postForEntity("/api/prep/drafts",body,Map.class); assertEquals(HttpStatus.CREATED,saved.getStatusCode()); assertEquals("7",balance(id));
        assertEquals(saved.getBody().get("id"),http.postForEntity("/api/prep/drafts",body,Map.class).getBody().get("id"));
        var draft=http.getForObject("/api/prep/drafts/"+saved.getBody().get("id"),Map.class);
        var line=((List<Map<String,Object>>)draft.get("lines")).stream().filter(l->l.get("ingredientId").toString().equals(id.toString())).findFirst().orElseThrow();
        assertEquals("12",line.get("quantity")); assertEquals("11",line.get("suggested"));
        var received=receipt(id,"11"); received.put("draftLineId",line.get("id"));
        assertEquals(HttpStatus.CREATED,http.postForEntity("/api/prep/receipts",received,Map.class).getStatusCode()); http.postForEntity("/api/prep/receipts",received,Map.class); assertEquals("18",balance(id));
        draft=http.getForObject("/api/prep/drafts/"+draft.get("id"),Map.class); line=((List<Map<String,Object>>)draft.get("lines")).stream().filter(l->l.get("ingredientId").toString().equals(id.toString())).findFirst().orElseThrow(); assertEquals("1",line.get("outstanding"));
        received=receipt(id,"2"); received.put("draftLineId",line.get("id")); assertEquals(HttpStatus.CONFLICT,http.postForEntity("/api/prep/receipts",received,Map.class).getStatusCode()); assertEquals("18",balance(id));
    }
    @Test void staleDraftIsRejectedAndWasteIsAtomicUnderConcurrency() throws Exception {
        Object id=item(); var receipt=http.postForEntity("/api/prep/receipts",receipt(id,"7"),Map.class).getBody(); var estimate=setupPlan(id,"2026-10-11");
        var waste=new HashMap<String,Object>(Map.of("ingredientId",id,"lotId",receipt.get("lotId"),"quantity","3","unit","kg","kind","WASTE","reason","SPOILED","note","Fictional demo","requestKey",UUID.randomUUID().toString()));
        assertEquals(HttpStatus.CREATED,http.postForEntity("/api/prep/removals",waste,Map.class).getStatusCode()); assertEquals(HttpStatus.CREATED,http.postForEntity("/api/prep/removals",waste,Map.class).getStatusCode()); assertEquals("4",balance(id));
        assertEquals(HttpStatus.CONFLICT,http.postForEntity("/api/prep/drafts",Map.of("date","2026-10-11","fingerprint",estimate.get("fingerprint"),"overrides",List.of(),"requestKey",UUID.randomUUID().toString()),Map.class).getStatusCode());
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=new HashMap<>(waste); first.put("requestKey",UUID.randomUUID().toString()); var second=new HashMap<>(waste); second.put("requestKey",UUID.randomUUID().toString());
            var responses=pool.invokeAll(List.of(()->http.postForEntity("/api/prep/removals",first,Map.class).getStatusCode(),()->http.postForEntity("/api/prep/removals",second,Map.class).getStatusCode()));
            var statuses=responses.stream().map(f->{try{return f.get();}catch(Exception e){throw new RuntimeException(e);}}).toList(); assertTrue(statuses.contains(HttpStatus.CREATED)); assertTrue(statuses.contains(HttpStatus.CONFLICT)); assertEquals("1",balance(id));
        }
        var invalid=new HashMap<>(waste); invalid.put("quantity","0"); invalid.put("requestKey",UUID.randomUUID().toString()); assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/removals",invalid,Map.class).getStatusCode());
    }
    @Test void notesAndOrdinaryUsageHaveDistinctPersistedHistory() {
        Object id=item(); var lot=http.postForEntity("/api/prep/receipts",receipt(id,"2"),Map.class).getBody().get("lotId");
        var removal=Map.of("ingredientId",id,"lotId",lot,"quantity","1","unit","kg","kind","USAGE","reason","MEAL_PREPARATION","requestKey",UUID.randomUUID().toString()); assertEquals(HttpStatus.CREATED,http.postForEntity("/api/prep/removals",removal,Map.class).getStatusCode()); assertEquals("1",balance(id));
        var note=http.postForEntity("/api/prep/notes",Map.of("targetType","INGREDIENT","targetId",id,"kind","HANDLING","text","Manager instruction: inspect each received lot.","actor","Anita"),Map.class); assertEquals(HttpStatus.CREATED,note.getStatusCode());
        var notes=http.getForObject("/api/prep/notes",List.class); assertTrue(notes.stream().anyMatch(n->((Map<?,?>)n).get("id").equals(note.getBody().get("id")))); assertEquals("Anita",note.getBody().get("actor")); assertNotNull(note.getBody().get("createdAt"));
    }
    @Test void managerCanEditGuidanceAndSeeTheLastEditorAndTime() {
        Object item=item(); var body=new HashMap<String,Object>(Map.of("targetType","INGREDIENT","targetId",item,"kind","HANDLING","text","Original handling note","actor","Original manager"));
        var original=http.postForEntity("/api/prep/notes",body,Map.class).getBody();body.put("text","Updated local kitchen instruction");body.put("actor","Kitchen lead");
        var edited=http.exchange("/api/prep/notes/"+original.get("id"),HttpMethod.PUT,new HttpEntity<>(body),Map.class);
        assertEquals(HttpStatus.OK,edited.getStatusCode());assertEquals(original.get("id"),edited.getBody().get("id"));assertEquals("Kitchen lead",edited.getBody().get("actor"));assertEquals("Updated local kitchen instruction",edited.getBody().get("text"));assertNotNull(edited.getBody().get("updatedAt"));assertEquals(original.get("createdAt"),edited.getBody().get("createdAt"));
        body.put("text","");assertEquals(HttpStatus.BAD_REQUEST,http.exchange("/api/prep/notes/"+original.get("id"),HttpMethod.PUT,new HttpEntity<>(body),Map.class).getStatusCode());
    }
}
