package com.restaurant.inventory.prep;

import java.time.LocalDate;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static com.restaurant.inventory.prep.PrepStockService.*;

/** Resets only registered fictional records; imported upstream records stay intact. */
@Service
public class DemoService {
    final PrepStockService stock; final PlanningService planning; final WorkflowService workflow; final boolean enabled;
    public DemoService(PrepStockService stock,PlanningService planning,WorkflowService workflow,@Value("${prep.demo-reset-enabled:false}") boolean enabled) { this.stock=stock;this.planning=planning;this.workflow=workflow;this.enabled=enabled; }
    public Map<String,Object> status() { return map("resetEnabled",enabled,"sampleDate",LocalDate.now(stock.kitchenClock()).plusDays(1).toString()); }
    @Transactional public Map<String,Object> reset(Map<String,Object> body) {
        if(!enabled)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Demo reset is disabled in this environment.");
        if(!required(body,"confirmation",80).equals("RESET FICTIONAL KITCHEN"))throw new IllegalArgumentException("Type RESET FICTIONAL KITCHEN to reset the sample records.");
        String mode=required(body,"mode",20); if(!Set.of("explore","walkthrough").contains(mode))throw new IllegalArgumentException("Choose explore or walkthrough.");
        var db=stock.database(); String ingredients="SELECT record_id FROM demo_seed_registry WHERE record_type='INGREDIENT'",recipes="SELECT record_id FROM demo_seed_registry WHERE record_type='RECIPE'";
        // A shared draft would erase non-sample decisions. Refuse that reset explicitly.
        int mixed=db.queryForObject("SELECT COUNT(*) FROM draft_lines WHERE inventory_id NOT IN ("+ingredients+") AND draft_id IN (SELECT draft_id FROM (SELECT draft_id FROM draft_lines WHERE inventory_id IN ("+ingredients+")) d)",Integer.class);
        if(mixed>0)throw conflict("A draft mixes sample and other ingredients. Use a fresh demo database for a clean reset.");
        var draftIds=db.queryForList("SELECT DISTINCT draft_id FROM draft_lines WHERE inventory_id IN ("+ingredients+")");
        db.update("DELETE FROM stock_movements WHERE inventory_id IN ("+ingredients+")"); db.update("DELETE FROM stock_lots WHERE inventory_id IN ("+ingredients+")");
        for(var d:draftIds) { db.update("DELETE FROM draft_lines WHERE draft_id=?",d.get("draft_id"));db.update("DELETE FROM purchase_drafts WHERE id=?",d.get("draft_id")); }
        db.update("DELETE FROM guidance_notes WHERE (target_type='INGREDIENT' AND target_id IN ("+ingredients+")) OR (target_type='RECIPE' AND target_id IN ("+recipes+"))");
        db.update("DELETE FROM meal_plans WHERE recipe_id IN ("+recipes+")"); db.update("DELETE FROM recipe_ingredients WHERE recipe_id IN ("+recipes+")"); db.update("DELETE FROM prep_recipes WHERE id IN ("+recipes+")");
        db.update("DELETE FROM planning_buffers WHERE inventory_id IN ("+ingredients+")");db.update("DELETE FROM stock_history WHERE inventory_item_id IN ("+ingredients+")");
        db.update("UPDATE inventory_items SET quantity_in_stock=0,updated_at=? WHERE id IN ("+ingredients+")",stock.now());
        db.update("UPDATE prep_ingredients SET purchase_increment_base=0,version=version+1 WHERE inventory_id IN ("+ingredients+")");
        db.update("DELETE FROM demo_seed_registry WHERE record_type='RECIPE'");
        Object rice=ingredient("Rice","kg"),tomatoes=ingredient("Tomatoes","kg"),onions=ingredient("Onions","kg"),paneer=ingredient("Paneer","kg");
        var today=LocalDate.now(stock.kitchenClock()); String tomorrow=today.plusDays(1).toString();
        receipt(rice,"30",today.plusDays(90).toString());receipt(onions,"8","");receipt(paneer,"1",today.plusDays(2).toString());
        if(mode.equals("explore")){receipt(tomatoes,"7",today.plusDays(4).toString());receipt(tomatoes,"3",today.minusDays(1).toString());}
        var pulao=recipe("Vegetable pulao",List.of(line(rice,"0.12"),line(tomatoes,"0.10"),line(onions,"0.04")));
        var curry=recipe("Paneer curry",List.of(line(paneer,"0.08"),line(tomatoes,"0.05"),line(onions,"0.03")));
        if(mode.equals("explore")){planning.savePlan(null,map("recipeId",pulao,"date",tomorrow,"portions",120));planning.savePlan(null,map("recipeId",curry,"date",tomorrow,"portions",120));}
        workflow.saveNote(map("targetType","INGREDIENT","targetId",tomatoes,"kind","HANDLING","text","Fictional manager note: keep lots separate, check the supplier label and inspect condition before prep. Ask the kitchen lead when dates or condition are unclear.","actor","Anita Rao (sample manager)"));
        workflow.saveNote(map("targetType","RECIPE","targetId",curry,"kind","APPROVED_SUBSTITUTION","text","Fictional manager-approved option: use the kitchen's reviewed tofu version only after checking diners' allergy requirements and updating the recipe quantities. This note does not change the plan automatically.","actor","Anita Rao (sample manager)"));
        return map("mode",mode,"date",tomorrow,"tomatoesId",tomatoes,"recipes",List.of(pulao,curry));
    }
    Object ingredient(String name,String unit) { var rows=stock.database().queryForList("SELECT i.id FROM inventory_items i JOIN demo_seed_registry r ON r.record_id=i.id AND r.record_type='INGREDIENT' WHERE i.name=?",name); if(!rows.isEmpty())return rows.getFirst().get("id"); var id=stock.createIngredient(map("name",name,"unit",unit)).get("id");stock.database().update("INSERT INTO demo_seed_registry VALUES('INGREDIENT',?)",id);return id; }
    Object recipe(String name,List<Map<String,Object>> ingredients) { var id=planning.saveRecipe(null,map("name",name,"ingredients",ingredients)).get("id");stock.database().update("INSERT INTO demo_seed_registry VALUES('RECIPE',?)",id);return id; }
    Map<String,Object> line(Object id,String quantity) { return map("ingredientId",id,"quantity",quantity,"unit","kg"); }
    void receipt(Object id,String quantity,String label) { stock.receive(map("ingredientId",id,"quantity",quantity,"unit","kg","unitCost","30","supplier","Fictional campus supplier","receivedDate",LocalDate.now(stock.kitchenClock()).toString(),"labelDate",label,"dateType",label.isEmpty()?"UNKNOWN":"BEST_BEFORE","requestKey",UUID.randomUUID().toString())); }
}
