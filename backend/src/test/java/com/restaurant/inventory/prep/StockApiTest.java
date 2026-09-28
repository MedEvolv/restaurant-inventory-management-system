package com.restaurant.inventory.prep;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(StockApiTest.FixedTime.class)
class StockApiTest {
    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate db;
    @BeforeEach void supportPatchRequests() { http.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory()); }
    @TestConfiguration static class FixedTime {
        @Bean @Primary Clock fixedClock() { return Clock.fixed(Instant.parse("2026-09-28T06:00:00Z"),ZoneId.of("Asia/Kolkata")); }
    }

    Object create(String unit) {
        var response=http.postForEntity("/api/prep/ingredients",Map.of("name","Test ingredient " + UUID.randomUUID(),"unit",unit),Map.class);
        assertEquals(HttpStatus.CREATED,response.getStatusCode()); return response.getBody().get("id");
    }
    Map<String,Object> receipt(Object id,String qty,String unit) {
        return new java.util.HashMap<>(Map.of("ingredientId",id,"quantity",qty,"unit",unit,"unitCost","30","receivedDate","2026-09-28","dateType","UNKNOWN","requestKey",UUID.randomUUID().toString()));
    }
    String onHand(Object id) { return (String)http.getForObject("/api/prep/ingredients/"+id,Map.class).get("onHand"); }

    @Test void actualReceiptsPersistAsDistinctLots() {
        var ingredient = http.postForEntity("/api/prep/ingredients", Map.of("name", "Test tomatoes " + UUID.randomUUID(), "unit", "kg"), Map.class);
        assertEquals(HttpStatus.CREATED, ingredient.getStatusCode());
        Object id = ingredient.getBody().get("id");
        var receipt = Map.of("ingredientId", id, "quantity", "2", "unit", "kg", "unitCost", "30", "receivedDate", "2026-09-28", "labelDate", "2026-10-02", "dateType", "BEST_BEFORE", "requestKey", UUID.randomUUID().toString());
        assertEquals(HttpStatus.CREATED, http.postForEntity("/api/prep/receipts", receipt, Map.class).getStatusCode());
        assertEquals(HttpStatus.CREATED,http.postForEntity("/api/prep/receipts",receipt(id,"500","g"),Map.class).getStatusCode());
        var stock = http.getForObject("/api/prep/ingredients/" + id, Map.class);
        assertEquals("2.5", stock.get("onHand"));
        assertEquals("kg", stock.get("unit"));
        var lots=(List<Map<String,Object>>)stock.get("lots");
        assertEquals(2,lots.size());
        assertEquals("2026-10-02",lots.get(0).get("labelDate"));
        assertNull(lots.get(1).get("labelDate"));
    }
    @Test void repeatedReceiptChangesStockOnceAndConflictingRetryIsRejected() {
        Object id=create("kg"); var body=receipt(id,"7","kg");
        var first=http.postForEntity("/api/prep/receipts",body,Map.class);
        var retry=http.postForEntity("/api/prep/receipts",body,Map.class);
        assertEquals(first.getBody().get("id"),retry.getBody().get("id"));
        assertEquals("7",onHand(id));
        body.put("quantity","8");
        assertEquals(HttpStatus.CONFLICT,http.postForEntity("/api/prep/receipts",body,Map.class).getStatusCode());
        assertEquals("7",onHand(id));
    }
    @Test void invalidReceiptDoesNotCreateStockAndLegacyWritesAreBlocked() {
        Object id=create("kg"); var body=receipt(id,"1","L");
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/receipts",body,Map.class).getStatusCode());
        body.put("unit","kg"); body.put("quantity","-1");
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/receipts",body,Map.class).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,http.exchange("/api/inventory/"+id+"/stock",HttpMethod.PATCH,new HttpEntity<>(Map.of("quantity",10)),Map.class).getStatusCode());
        assertEquals("0",onHand(id));
    }
    @Test void databaseAuditFailureRollsBackReceiptAndBalance() {
        Object id=create("kg");
        db.execute("ALTER TABLE stock_history ADD CONSTRAINT prep_test_fail_audit CHECK (inventory_item_id <> "+id+")");
        try {
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,http.postForEntity("/api/prep/receipts",receipt(id,"3","kg"),Map.class).getStatusCode());
            assertEquals("0",onHand(id));
            assertTrue(((List<?>)http.getForObject("/api/prep/ingredients/"+id,Map.class).get("lots")).isEmpty());
        } finally { db.execute("ALTER TABLE stock_history DROP CHECK prep_test_fail_audit"); }
    }
    @Test void competingDuplicateReceiptsCommitOnce() throws Exception {
        Object id=create("kg"); var body=receipt(id,"7","kg");
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var results=pool.<org.springframework.http.HttpStatusCode>invokeAll(List.of(()->http.postForEntity("/api/prep/receipts",body,Map.class).getStatusCode(),()->http.postForEntity("/api/prep/receipts",body,Map.class).getStatusCode()));
            for(var result:results)assertEquals(HttpStatus.CREATED,result.get());
        }
        assertEquals("7",onHand(id));assertEquals(1,((List<?>)http.getForObject("/api/prep/ingredients/"+id,Map.class).get("lots")).size());
    }
}
