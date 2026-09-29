package com.restaurant.inventory.prep;

import java.util.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import static com.restaurant.inventory.prep.PrepStockService.map;

@RestController
@RequestMapping("/api/prep")
public class GuidanceController {
    private final GuidanceService guidance; private final GuidanceEscalationService escalations;
    public GuidanceController(GuidanceService guidance,GuidanceEscalationService escalations) { this.guidance=guidance;this.escalations=escalations; }
    @GetMapping("/today") public Map<String,Object> today(@RequestParam String date,@RequestParam(defaultValue="hi") String language) { return guidance.today(date,language); }
    @GetMapping("/guidance/published") public List<Map<String,Object>> published(@RequestParam(required=false) Long recipeId,@RequestParam(defaultValue="hi") String language) { return guidance.published(recipeId,language); }
    @GetMapping("/guidance") public List<Map<String,Object>> list() { return guidance.documents(); }
    @PostMapping("/guidance") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> create(@RequestBody Map<String,Object> body) { return guidance.create(body); }
    @GetMapping("/guidance/{id}") public Map<String,Object> get(@PathVariable long id) { return guidance.document(id); }
    @PutMapping("/guidance/{id}") public Map<String,Object> update(@PathVariable long id,@RequestBody Map<String,Object> body) { return guidance.update(id,body); }
    @PostMapping("/guidance/{id}/publish") public Map<String,Object> publish(@PathVariable long id,@RequestBody Map<String,Object> body) { return guidance.publish(id,body); }
    @PostMapping(value="/guidance/{id}/photos",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public Map<String,Object> upload(@PathVariable long id,@RequestPart("file") MultipartFile file,@RequestParam String caption,@RequestParam String kind,@RequestParam String isDemo,@RequestParam int expectedVersion) { if(!"true".equalsIgnoreCase(isDemo)&&!"false".equalsIgnoreCase(isDemo))throw new IllegalArgumentException("isDemo must be true or false.");return guidance.upload(id,file,caption,kind,Boolean.parseBoolean(isDemo),expectedVersion); }
    @DeleteMapping("/guidance/{docId}/photos/{photoId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void removePhoto(@PathVariable long docId,@PathVariable long photoId,@RequestParam int expectedVersion) { guidance.removePhoto(docId,photoId,expectedVersion); }
    @GetMapping("/guidance/photos/{id}") public ResponseEntity<byte[]> staffPhoto(@PathVariable long id) { return guidance.photo(id,null,true); }
    @GetMapping("/guidance/{docId}/photos/{photoId}") public ResponseEntity<byte[]> managerPhoto(@PathVariable long docId,@PathVariable long photoId) { return guidance.photo(photoId,docId,false); }
    @PostMapping("/escalations") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> createEscalation(@RequestBody Map<String,Object> body) { return escalations.create(body); }
    @GetMapping("/escalations") public List<Map<String,Object>> escalations() { return escalations.list(); }
    @PutMapping("/escalations/{id}/resolve") public Map<String,Object> resolveEscalation(@PathVariable long id,@RequestBody Map<String,Object> body) { return escalations.resolve(id,body); }
    @ExceptionHandler(MaxUploadSizeExceededException.class) public ResponseEntity<Map<String,Object>> tooLarge(MaxUploadSizeExceededException e) { return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(map("message","Image exceeds 5 MB.")); }
    @ExceptionHandler({MissingServletRequestParameterException.class,MissingServletRequestPartException.class,MethodArgumentTypeMismatchException.class}) public ResponseEntity<Map<String,Object>> invalidMultipart(Exception e) { return ResponseEntity.badRequest().body(map("message","Photo upload requires file, caption, kind, isDemo true/false, and a positive expectedVersion.")); }
}
