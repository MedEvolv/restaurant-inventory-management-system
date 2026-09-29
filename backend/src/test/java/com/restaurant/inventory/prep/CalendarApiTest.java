package com.restaurant.inventory.prep;

import java.util.*;
import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test") @Import(StockApiTest.FixedTime.class)
class CalendarApiTest {
    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate db;
    @Autowired PrepStockService stock;
    private String date;
    private final Set<Long> ownedPlans=new HashSet<>();
    private final Set<String> ownedMealTimes=new HashSet<>();

    @BeforeEach void chooseEmptyWindow() {
        LocalDate candidate=LocalDate.of(2040,1,1).plusDays(ThreadLocalRandom.current().nextInt(10000));
        for(int attempt=0;attempt<10000;attempt++,candidate=candidate.plusDays(1)) {
            LocalDate end=candidate.plusDays(18);
            Integer plans=db.queryForObject("SELECT COUNT(*) FROM meal_plans WHERE meal_date BETWEEN ? AND ?",Integer.class,candidate,end);
            Integer times=db.queryForObject("SELECT COUNT(*) FROM meal_service_times WHERE meal_date BETWEEN ? AND ?",Integer.class,candidate,end);
            if(plans==0&&times==0){date=candidate.toString();return;}
        }
        throw new IllegalStateException("Could not find an empty calendar test window.");
    }
    @AfterEach void removeOnlyRowsCreatedByThisTest() {
        for(long id:ownedPlans)db.update("DELETE FROM meal_plans WHERE id=?",id);
        for(String key:ownedMealTimes){String[] parts=key.split("\\|",2);db.update("DELETE FROM meal_service_times WHERE meal_date=? AND meal_slot=?",LocalDate.parse(parts[0]),parts[1]);}
    }

    Object recipe() {
        Object ingredient=http.postForEntity("/api/prep/ingredients",Map.of("name","Calendar "+UUID.randomUUID(),"unit","kg"),Map.class).getBody().get("id");
        return http.postForEntity("/api/prep/recipes",Map.of("name","Calendar dish "+UUID.randomUUID(),"ingredients",List.of(Map.of("ingredientId",ingredient,"quantity","0.125","unit","kg"))),Map.class).getBody().get("id");
    }
    Map<String,Object> createPlan(Object recipeId,String at,int portions) {
        var response=http.postForEntity("/api/prep/plans",Map.of("recipeId",recipeId,"date",at,"portions",portions),Map.class);
        assertEquals(HttpStatus.CREATED,response.getStatusCode());ownedPlans.add(((Number)response.getBody().get("id")).longValue());return response.getBody();
    }
    Map<String,Object> createPlan(Object recipeId,String at,int portions,String slot) {
        var response=http.postForEntity("/api/prep/plans",Map.of("recipeId",recipeId,"date",at,"portions",portions,"mealSlot",slot),Map.class);
        assertEquals(HttpStatus.CREATED,response.getStatusCode());ownedPlans.add(((Number)response.getBody().get("id")).longValue());return response.getBody();
    }
    Map<String,Object> saveTime(String at,String slot,Object time) {
        var body=new LinkedHashMap<String,Object>(); body.put("date",at);body.put("mealSlot",slot);body.put("serveTime",time);
        var response=http.exchange("/api/prep/meal-times",HttpMethod.PUT,new HttpEntity<>(body),Map.class);
        assertEquals(HttpStatus.OK,response.getStatusCode());ownedMealTimes.add(at+"|"+slot);return response.getBody();
    }
    @Test void legacyPlansKeepTheirLargePortionsAndSlotOnOmittedUpdate() {
        Object rid=recipe();var created=createPlan(rid,date,120);Object planId=created.get("id");
        var response=http.getForObject("/api/prep/plans?date="+date,List.class);var plan=(Map<?,?>)response.stream().filter(p->((Map<?,?>)p).get("id").toString().equals(planId.toString())).findFirst().orElseThrow();
        assertEquals("UNASSIGNED",plan.get("mealSlot"));assertNull(plan.get("serveTime"));assertEquals(120,plan.get("portions"));
        var update=http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",rid,"date",date,"portions",999)),Map.class);
        assertEquals(HttpStatus.OK,update.getStatusCode());plan=(Map<?,?>)http.getForObject("/api/prep/plans?date="+date,List.class).stream().filter(p->((Map<?,?>)p).get("id").toString().equals(planId.toString())).findFirst().orElseThrow();
        assertEquals("UNASSIGNED",plan.get("mealSlot"));assertEquals(999,plan.get("portions"));
        var assign=http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",rid,"date",date,"portions",999,"mealSlot","LUNCH")),Map.class);assertEquals(HttpStatus.OK,assign.getStatusCode());
        update=http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",rid,"date",date,"portions",1000)),Map.class);assertEquals(HttpStatus.OK,update.getStatusCode());
        plan=(Map<?,?>)http.getForObject("/api/prep/plans?date="+date,List.class).stream().filter(p->((Map<?,?>)p).get("id").toString().equals(planId.toString())).findFirst().orElseThrow();assertEquals("LUNCH",plan.get("mealSlot"));
    }
    @Test void explicitInvalidSlotValuesAreRejected() {
        Object rid=recipe();
        for(Object invalid:Arrays.asList(null,42,"BRUNCH","unassigned")) {
            var body=new LinkedHashMap<String,Object>();body.put("recipeId",rid);body.put("date",date);body.put("portions",2);body.put("mealSlot",invalid);
            assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/plans",body,Map.class).getStatusCode());
        }
        var plan=createPlan(rid,date,2);var badUpdate=new LinkedHashMap<String,Object>(Map.of("recipeId",rid,"date",date,"portions",2));badUpdate.put("mealSlot",null);
        assertEquals(HttpStatus.BAD_REQUEST,http.exchange("/api/prep/plans/"+plan.get("id"),HttpMethod.PUT,new HttpEntity<>(badUpdate),Map.class).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,null,"08:00"));
        assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,"BREAKFAST","8:00"));
        assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,"BREAKFAST","24:00"));assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,"BREAKFAST","25:00"));assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,"BREAKFAST","13:60"));
        assertEquals(HttpStatus.BAD_REQUEST,saveTimeStatus(date,"BREAKFAST",null));
    }
    private HttpStatusCode saveTimeStatus(String at,Object slot,Object time) {
        var body=new LinkedHashMap<String,Object>();body.put("date",at);body.put("mealSlot",slot);body.put("serveTime",time);
        return http.exchange("/api/prep/meal-times",HttpMethod.PUT,new HttpEntity<>(body),Map.class).getStatusCode();
    }
    private String originalV8Fingerprint(Map<String,Object> estimate) {
        var legacyPlans=((List<Map<String,Object>>)estimate.get("plans")).stream().map(p->{var plan=new LinkedHashMap<String,Object>();plan.put("id",p.get("id"));plan.put("recipeId",p.get("recipeId"));plan.put("name",p.get("name"));plan.put("date",p.get("date"));plan.put("portions",p.get("portions"));return plan;}).toList();
        var originalShape=new LinkedHashMap<String,Object>();originalShape.put("date",estimate.get("date"));originalShape.put("plans",legacyPlans);originalShape.put("lines",estimate.get("lines"));
        return stock.hash(originalShape);
    }
    @Test void calendarIsSevenInclusiveDaysWithEmptyDatesAndMultipleDishesPerSlot() {
        String start=date;String serviceDate=LocalDate.parse(start).plusDays(1).toString();Object first=recipe(),second=recipe(); var firstPlan=createPlan(first,serviceDate,120,"DINNER"); assertEquals(HttpStatus.OK,http.exchange("/api/prep/plans/"+firstPlan.get("id"),HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",first,"date",serviceDate,"portions",120,"mealSlot","DINNER")),Map.class).getStatusCode());
        createPlan(second,serviceDate,75,"DINNER");
        var calendar=http.getForObject("/api/prep/calendar?start="+start,Map.class);
        assertEquals(start,calendar.get("start"));assertEquals(LocalDate.parse(start).plusDays(6).toString(),calendar.get("end"));var days=(List<Map<String,Object>>)calendar.get("days");assertEquals(7,days.size());
        assertEquals(start,days.getFirst().get("date"));assertEquals(LocalDate.parse(start).plusDays(6).toString(),days.getLast().get("date"));assertTrue(((List<?>)days.getFirst().get("plans")).isEmpty());
        Map<String,Object> serviceDay=days.get(1);var plans=(List<Map<String,Object>>)serviceDay.get("plans");assertEquals(2,plans.size());assertTrue(plans.stream().allMatch(p->"DINNER".equals(p.get("mealSlot"))));assertTrue(plans.stream().allMatch(p->"20:00".equals(p.get("serveTime"))));
        assertEquals(Map.of("BREAKFAST","08:00","LUNCH","13:00","DINNER","20:00"),serviceDay.get("mealTimes"));
    }
    @Test void overridesPersistAndReadDefaultsRemainDerivedIncludingEmptyTodayMeals() {
        saveTime(date,"DINNER","19:35");Object rid=recipe();createPlan(rid,date,3);
        var calendar=http.getForObject("/api/prep/calendar?start="+date,Map.class);var day=((List<Map<String,Object>>)calendar.get("days")).getFirst();
        assertEquals("19:35",((Map<?,?>)day.get("mealTimes")).get("DINNER"));assertEquals("08:00",((Map<?,?>)day.get("mealTimes")).get("BREAKFAST"));
        var today=http.getForObject("/api/prep/today?date="+date,Map.class);assertEquals("19:35",((Map<?,?>)today.get("mealTimes")).get("DINNER"));
        var unassigned=createPlan(recipe(),date,2);today=http.getForObject("/api/prep/today?date="+date,Map.class);var dish=((List<Map<String,Object>>)today.get("dishes")).stream().filter(x->x.get("planId").toString().equals(unassigned.get("id").toString())).findFirst().orElseThrow();assertEquals("UNASSIGNED",dish.get("mealSlot"));assertNull(dish.get("serveTime"));
        saveTime(date,"BREAKFAST","07:45");today=http.getForObject("/api/prep/today?date="+date,Map.class);assertEquals("07:45",((Map<?,?>)today.get("mealTimes")).get("BREAKFAST"));
    }
    @Test void slotAndScheduleChangesDoNotChangeDailyQuantityEstimateOrGuidance() {
        Object rid=recipe();var created=createPlan(rid,date,4);Object planId=created.get("id");
        var draft=new LinkedHashMap<String,Object>();draft.put("recipeId",rid);draft.put("title","Calendar guidance");draft.put("owner","Kitchen lead");draft.put("method","Follow the reviewed method");draft.put("handling","Keep covered");draft.put("substitutions","None approved");draft.put("portionNote","Four portions");draft.put("applicability","Applies to today's dish");draft.put("nextAction","Review after service");draft.put("sourceReference","Recipe card");draft.put("isDemo",true);
        var createdGuide=http.postForEntity("/api/prep/guidance",draft,Map.class);assertEquals(HttpStatus.CREATED,createdGuide.getStatusCode());Object guideId=createdGuide.getBody().get("id");assertEquals(HttpStatus.OK,http.postForEntity("/api/prep/guidance/"+guideId+"/publish",Map.of("expectedVersion",1),Map.class).getStatusCode());
        var before=http.getForObject("/api/prep/estimate?date="+date,Map.class);
        assertEquals(originalV8Fingerprint(before),before.get("fingerprint"));
        var req=http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",rid,"date",date,"portions",4,"mealSlot","BREAKFAST")),Map.class);assertEquals(HttpStatus.OK,req.getStatusCode());saveTime(date,"BREAKFAST","09:10");
        var after=http.getForObject("/api/prep/estimate?date="+date,Map.class);assertEquals(before.get("lines"),after.get("lines"));assertEquals(before.get("fingerprint"),after.get("fingerprint"));assertEquals(originalV8Fingerprint(after),after.get("fingerprint"));
        var today=http.getForObject("/api/prep/today?date="+date,Map.class);var dish=((List<Map<String,Object>>)today.get("dishes")).stream().filter(x->x.get("planId").toString().equals(planId.toString())).findFirst().orElseThrow();assertEquals("09:10",dish.get("serveTime"));
        var quantities=(List<Map<String,Object>>)dish.get("quantities");assertEquals("0.5",quantities.getFirst().get("required"));assertEquals(1,((List<?>)dish.get("guidance")).size());
        assertEquals(HttpStatus.OK,http.exchange("/api/prep/plans/"+planId,HttpMethod.PUT,new HttpEntity<>(Map.of("recipeId",rid,"date",date,"portions",5,"mealSlot","BREAKFAST")),Map.class).getStatusCode());
        var portionChange=http.getForObject("/api/prep/estimate?date="+date,Map.class);assertNotEquals(after.get("fingerprint"),portionChange.get("fingerprint"));assertEquals(originalV8Fingerprint(portionChange),portionChange.get("fingerprint"));
        today=http.getForObject("/api/prep/today?date="+date,Map.class);dish=((List<Map<String,Object>>)today.get("dishes")).stream().filter(x->x.get("planId").toString().equals(planId.toString())).findFirst().orElseThrow();assertEquals("0.625",((List<Map<String,Object>>)dish.get("quantities")).getFirst().get("required"));assertEquals(1,((List<?>)dish.get("guidance")).size());
    }
    @Test void demoResetPreservesAnUnrelatedMealTimeOverride() {
        String at=LocalDate.parse(date).plusDays(12).toString();saveTime(at,"LUNCH","12:25");
        var reset=http.postForEntity("/api/prep/demo/reset",Map.of("confirmation","RESET FICTIONAL KITCHEN","mode","explore"),Map.class);assertEquals(HttpStatus.OK,reset.getStatusCode());
        var day=http.getForObject("/api/prep/calendar?start="+at,Map.class);var mealTimes=(Map<?,?>)((List<Map<String,Object>>)day.get("days")).getFirst().get("mealTimes");assertEquals("12:25",mealTimes.get("LUNCH"));
    }
}
