package com.restaurant.inventory.prep;

import java.util.Map;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataAccessException;

@Order(-1)
@RestControllerAdvice(basePackages = "com.restaurant.inventory.prep")
public class PrepErrors {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(PrepErrors.class);
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid(IllegalArgumentException error) { return ResponseEntity.badRequest().body(Map.of("message", error.getMessage())); }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    ResponseEntity<?> malformed(Exception error) { return ResponseEntity.badRequest().body(Map.of("message","Send valid JSON with the required fields.")); }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException error) { return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason())); }
    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<?> duplicate(DuplicateKeyException error) { return ResponseEntity.status(409).body(Map.of("message", "This request has already been recorded. Refresh and review it.")); }
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<?> database(DataAccessException error) { log.error("Kitchen transaction failed",error); return ResponseEntity.internalServerError().body(Map.of("message", "Could not save this change. No stock change was recorded.")); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception error) { log.error("Kitchen request failed",error); return ResponseEntity.internalServerError().body(Map.of("message","Could not complete this request. Refresh and retry.")); }
}
