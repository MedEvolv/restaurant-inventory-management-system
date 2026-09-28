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
class PlanningApiTest {
    @Autowired TestRestTemplate http;
    Object ingredient(String unit) { var r=http.postForEntity("/api/prep/ingredients",Map.of("name","Planning "+UUID.randomUUID(),"unit",unit),Map.class); assertEquals(HttpStatus.CREATED,r.getStatusCode()); return r.getBody().get("id"); }
    Object recipe(Object id,String qty,String unit) { var r=http.postForEntity("/api/prep/recipes",Map.of("name","Dish "+UUID.randomUUID(),"ingredients",List.of(Map.of("ingredientId",id,"quantity",qty,"unit",unit))),Map.class); assertEquals(HttpStatus.CREATED,r.getStatusCode()); return r.getBody().get("id"); }
    Map<String,Object> receive(Object id,String qty,String label) { var b=new HashMap<String,Object>(Map.of("ingredientId",id,"quantity",qty,"unit","kg","unitCost","30","receivedDate","2026-09-28","dateType",label.isEmpty()?"UNKNOWN":"BEST_BEFORE","requestKey",UUID.randomUUID().toString())); if(!label.isEmpty())b.put("labelDate",label); var r=http.postForEntity("/api/prep/receipts",b,Map.class); assertEquals(HttpStatus.CREATED,r.getStatusCode()); return r.getBody(); }
    Object plan(Object recipe,String date,int portions) { var r=http.postForEntity("/api/prep/plans",Map.of("recipeId",recipe,"date",date,"portions",portions),Map.class); assertEquals(HttpStatus.CREATED,r.getStatusCode()); return r.getBody().get("id"); }
    Map<String,Object> line(Object id,String date) { var e=http.getForObject("/api/prep/estimate?date="+date,Map.class); return ((List<Map<String,Object>>)e.get("lines")).stream().filter(l->l.get("ingredientId").toString().equals(id.toString())).findFirst().orElseThrow(); }
    @Test void aggregatesDishesExcludesPassedDatesAndExplainsArithmetic() {
        var id=ingredient("kg"); receive(id,"7","2026-10-02"); receive(id,"3","2026-09-28");
        plan(recipe(id,"100","g"),"2026-09-29",120); plan(recipe(id,"0.05","kg"),"2026-09-29",120);
        var l=line(id,"2026-09-29"); assertEquals("18",l.get("required")); assertEquals("10",l.get("onHand")); assertEquals("3",l.get("excluded")); assertEquals("7",l.get("usable")); assertEquals("0",l.get("buffer")); assertEquals("11",l.get("suggested"));
        assertEquals(2,((List<?>)l.get("breakdown")).size()); assertEquals("10",http.getForObject("/api/prep/ingredients/"+id,Map.class).get("onHand"));
    }
    @Test void editsRemoveRecalculateBuffersAndRoundUp() {
        var id=ingredient("kg"); var dish=recipe(id,"0.15","kg"); var p=plan(dish,"2026-09-30",120);
        assertEquals("18",line(id,"2026-09-30").get("suggested"));
        var r=http.exchange("/api/prep/plans/"+p,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",dish,"date","2026-09-30","portions",10)),Map.class); assertEquals(HttpStatus.OK,r.getStatusCode());
        assertEquals(HttpStatus.OK,http.exchange("/api/prep/planning-settings/"+id,HttpMethod.PUT,new HttpEntity<>(Map.of("date","2026-09-30","buffer","0.1","increment","1","unit","kg")),Map.class).getStatusCode());
        var l=line(id,"2026-09-30"); assertEquals("1.5",l.get("required")); assertEquals("0.1",l.get("buffer")); assertEquals("2",l.get("suggested"));
        http.delete("/api/prep/plans/"+p); assertFalse(((List<Map<String,Object>>)http.getForObject("/api/prep/estimate?date=2026-09-30",Map.class).get("lines")).stream().anyMatch(x->x.get("ingredientId").toString().equals(id.toString())));
    }
    @Test void rejectsInvalidUnitsAndPortionsAndKeepsMissingDatesVisible() {
        var id=ingredient("kg"); receive(id,"20",""); var dish=recipe(id,"0.15","kg"); plan(dish,"2026-10-01",120);
        var l=line(id,"2026-10-01"); assertEquals("0",l.get("suggested")); assertEquals("20",l.get("unknownDateStock"));
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/recipes",Map.of("name","Wrong units","ingredients",List.of(Map.of("ingredientId",id,"quantity","1","unit","L"))),Map.class).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/plans",Map.of("recipeId",dish,"date","2026-10-01","portions",0),Map.class).getStatusCode());
    }
    @Test void recipeEditsAndDateBoundaryRecalculateExactly() {
        var id=ingredient("kg");receive(id,"1.5","2026-10-04"); var dish=recipe(id,"0.15","kg");var plan=plan(dish,"2026-10-04",10);
        assertEquals("1.5",line(id,"2026-10-04").get("usable"));assertEquals("0",line(id,"2026-10-04").get("excluded"));assertEquals("0",line(id,"2026-10-04").get("suggested"));
        assertEquals(HttpStatus.OK,http.exchange("/api/prep/recipes/"+dish,HttpMethod.PUT,new HttpEntity<>(Map.of("name","Edited recipe","ingredients",List.of(Map.of("ingredientId",id,"quantity","200","unit","g")))),Map.class).getStatusCode());
        assertEquals("2",line(id,"2026-10-04").get("required"));assertEquals("0.5",line(id,"2026-10-04").get("suggested"));
        assertEquals(HttpStatus.CONFLICT,http.exchange("/api/prep/recipes/"+dish,HttpMethod.DELETE,HttpEntity.EMPTY,Map.class).getStatusCode());
        http.delete("/api/prep/plans/"+plan);assertEquals(HttpStatus.OK,http.exchange("/api/prep/recipes/"+dish,HttpMethod.DELETE,HttpEntity.EMPTY,Map.class).getStatusCode());
    }
}
