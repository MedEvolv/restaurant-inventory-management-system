package com.restaurant.inventory.prep;

import java.util.Map;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prep")
public class PrepController {
    private final PrepStockService stock;
    private final PlanningService planning;
    private final WorkflowService workflow;
    private final DemoService demo;
    public PrepController(PrepStockService stock,PlanningService planning,WorkflowService workflow,DemoService demo) { this.stock=stock; this.planning=planning; this.workflow=workflow; this.demo=demo; }
    @GetMapping("/ingredients") public List<Map<String,Object>> ingredients() { return stock.ingredients(); }
    @GetMapping("/ingredients/{id}") public Map<String,Object> ingredient(@PathVariable long id) { return stock.ingredient(id); }
    @PostMapping("/ingredients") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createIngredient(@RequestBody Map<String,Object> body) { return stock.createIngredient(body); }
    @PostMapping("/receipts") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> receive(@RequestBody Map<String,Object> body) { return stock.receive(body); }
    @GetMapping("/history") public List<Map<String,Object>> history() { return stock.history(); }
    @GetMapping("/recipes") public List<Map<String,Object>> recipes() { return planning.recipes(); }
    @PostMapping("/recipes") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> createRecipe(@RequestBody Map<String,Object> body) { return planning.saveRecipe(null,body); }
    @PutMapping("/recipes/{id}") public Map<String,Object> editRecipe(@PathVariable long id,@RequestBody Map<String,Object> body) { return planning.saveRecipe(id,body); }
    @DeleteMapping("/recipes/{id}") public void archiveRecipe(@PathVariable long id) { planning.archiveRecipe(id); }
    @GetMapping("/plans") public List<Map<String,Object>> plans(@RequestParam String date) { return planning.plans(date); }
    @PostMapping("/plans") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> createPlan(@RequestBody Map<String,Object> body) { return planning.savePlan(null,body); }
    @PutMapping("/plans/{id}") public Map<String,Object> editPlan(@PathVariable long id,@RequestBody Map<String,Object> body) { return planning.savePlan(id,body); }
    @DeleteMapping("/plans/{id}") public void deletePlan(@PathVariable long id) { planning.deletePlan(id); }
    @GetMapping("/calendar") public Map<String,Object> calendar(@RequestParam String start) { return planning.calendar(start); }
    @PutMapping("/meal-times") public Map<String,Object> mealTime(@RequestBody Map<String,Object> body) { return planning.saveMealTime(body); }
    @PutMapping("/planning-settings/{id}") public Map<String,Object> settings(@PathVariable long id,@RequestBody Map<String,Object> body) { return planning.settings(id,body); }
    @GetMapping("/estimate") public Map<String,Object> estimate(@RequestParam String date) { return planning.estimate(date); }
    @GetMapping("/drafts") public List<Map<String,Object>> drafts() { return workflow.drafts(); }
    @GetMapping("/drafts/{id}") public Map<String,Object> draft(@PathVariable long id) { return workflow.draft(id); }
    @PostMapping("/drafts") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> draft(@RequestBody Map<String,Object> body) { return workflow.saveDraft(body); }
    @PostMapping("/removals") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> remove(@RequestBody Map<String,Object> body) { return workflow.remove(body); }
    @GetMapping("/notes") public List<Map<String,Object>> notes() { return workflow.notes(); }
    @PostMapping("/notes") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> note(@RequestBody Map<String,Object> body) { return workflow.saveNote(body); }
    @PutMapping("/notes/{id}") public Map<String,Object> editNote(@PathVariable long id,@RequestBody Map<String,Object> body) { return workflow.saveNote(id,body); }
    @GetMapping("/demo") public Map<String,Object> demoStatus() { return demo.status(); }
    @PostMapping("/demo/reset") public Map<String,Object> demoReset(@RequestBody Map<String,Object> body) { return demo.reset(body); }
}
