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
class DemoApiTest {
    @Autowired TestRestTemplate http;
    @Test void reseedIsRepeatableAndPreservesUnregisteredRecords() {
        var id=http.postForEntity("/api/prep/ingredients",Map.of("name","Preserved "+UUID.randomUUID(),"unit","kg"),Map.class).getBody().get("id");
        http.postForEntity("/api/prep/receipts",Map.of("ingredientId",id,"quantity","2","unit","kg","unitCost","30","receivedDate","2026-09-28","dateType","UNKNOWN","requestKey",UUID.randomUUID().toString()),Map.class);
        assertEquals(HttpStatus.BAD_REQUEST,http.postForEntity("/api/prep/demo/reset",Map.of("confirmation","","mode","explore"),Map.class).getStatusCode());
        for(String mode:List.of("explore","walkthrough","explore")) {
            var reset=http.postForEntity("/api/prep/demo/reset",Map.of("confirmation","RESET FICTIONAL KITCHEN","mode",mode),Map.class); assertEquals(HttpStatus.OK,reset.getStatusCode(),String.valueOf(reset.getBody()));
            assertEquals("2",http.getForObject("/api/prep/ingredients/"+id,Map.class).get("onHand"));
            var tomato=http.getForObject("/api/prep/ingredients/"+reset.getBody().get("tomatoesId"),Map.class); assertEquals(mode.equals("explore")?"10":"0",tomato.get("onHand"));
        }
    }
}
