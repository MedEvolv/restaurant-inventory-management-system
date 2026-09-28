package com.restaurant.inventory.prep;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.restaurant.inventory.prep.PrepStockService.*;

@Service
public class WorkflowService {
    final PrepStockService stock; final PlanningService planning;
    public WorkflowService(PrepStockService stock,PlanningService planning) { this.stock=stock; this.planning=planning; }
    @Transactional public Map<String,Object> saveDraft(Map<String,Object> body) {
        String key=required(body,"requestKey",100),hash=stock.hash(body);
        var existing=stock.database().queryForList("SELECT id,payload_hash FROM purchase_drafts WHERE request_key=?",key);
        if(!existing.isEmpty()) { var r=existing.getFirst(); if(!hash.equals(r.get("payload_hash")))throw conflict("This request key was already used for different content."); return draft(((Number)r.get("id")).longValue()); }
        String date=required(body,"date",10); var estimate=planning.estimate(date);
        if(!required(body,"fingerprint",64).equals(estimate.get("fingerprint")))throw conflict("The plan or stock changed. Refresh the estimate and review the draft again.");
        var lines=(List<Map<String,Object>>)estimate.get("lines"); if(lines.isEmpty())throw new IllegalArgumentException("Plan at least one dish before saving a purchase draft.");
        if(!(body.get("overrides") instanceof List<?> overrides))throw new IllegalArgumentException("Overrides must be a list.");
        var quantities=new HashMap<Long,BigDecimal>();
        for(Object raw:overrides) { if(!(raw instanceof Map<?,?>))throw new IllegalArgumentException("Invalid override."); var override=(Map<String,Object>)raw; long id=id(override,"ingredientId"); if(quantities.put(id,decimal(override,"quantity",false,9))!=null)throw new IllegalArgumentException("Duplicate draft override."); if(lines.stream().noneMatch(l->l.get("ingredientId").toString().equals(Long.toString(id))))throw new IllegalArgumentException("Override ingredient is not in this meal plan."); }
        String snapshot; try { snapshot=stock.mapper().writeValueAsString(estimate); }catch(Exception e){throw new IllegalArgumentException("Could not save the estimate.");}
        long id=stock.insert("INSERT INTO purchase_drafts(meal_date,fingerprint,snapshot_json,actor,request_key,payload_hash,created_at) VALUES(?,?,?,?,?,?,?)",date,estimate.get("fingerprint"),snapshot,stock.optionalActor(body),key,hash,stock.now());
        for(var line:lines) {
            long ingredient=((Number)line.get("ingredientId")).longValue(); String unit=(String)line.get("unit"),base=Units.baseUnit(unit);
            var suggested=new BigDecimal((String)line.get("suggested")); var quantity=quantities.getOrDefault(ingredient,suggested);
            stock.database().update("INSERT INTO draft_lines(draft_id,inventory_id,suggested_base,ordered_base,display_unit) VALUES(?,?,?,?,?)",id,ingredient,Units.toBase(suggested,unit,base),Units.toBase(quantity,unit,base),unit);
        }
        return draft(id);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> drafts() { return stock.database().queryForList("SELECT id FROM purchase_drafts ORDER BY id DESC LIMIT 100").stream().map(r->draft(((Number)r.get("id")).longValue())).toList(); }
    Map<String,Object> draft(long id) {
        var row=stock.one("SELECT * FROM purchase_drafts WHERE id=?",id); String date=row.get("meal_date").toString(); Object snapshot;
        try { snapshot=stock.mapper().readValue((String)row.get("snapshot_json"),Map.class); }catch(Exception e){throw new IllegalStateException("Invalid stored draft snapshot",e);}
        var lines=stock.database().queryForList("SELECT l.*,i.name FROM draft_lines l JOIN inventory_items i ON i.id=l.inventory_id WHERE draft_id=? ORDER BY l.id",id).stream().map(l->{ String unit=(String)l.get("display_unit"); var received=(BigDecimal)l.get("received_base"); var quantity=(BigDecimal)l.get("ordered_base"); return map("id",l.get("id"),"ingredientId",l.get("inventory_id"),"name",l.get("name"),"unit",unit,"suggested",PlanningService.display((BigDecimal)l.get("suggested_base"),unit),"quantity",PlanningService.display(quantity,unit),"received",PlanningService.display(received,unit),"outstanding",PlanningService.display(quantity.subtract(received),unit)); }).toList();
        boolean stale=!row.get("fingerprint").equals(planning.estimate(date).get("fingerprint"));
        return map("id",id,"date",date,"actor",row.get("actor"),"createdAt",row.get("created_at").toString(),"stale",stale,"lines",lines,"snapshot",snapshot);
    }
    @Transactional public Map<String,Object> remove(Map<String,Object> body) {
        long itemId=id(body,"ingredientId"),lotId=id(body,"lotId"); var item=stock.lockIngredient(itemId);
        String key=required(body,"requestKey",100),hash=stock.hash(body); var replay=stock.replay(key,hash); if(replay!=null)return replay;
        var lot=stock.one("SELECT * FROM stock_lots WHERE id=? AND inventory_id=? FOR UPDATE",lotId,itemId);
        var quantity=Units.toBase(decimal(body,"quantity",true,9),required(body,"unit",20),(String)item.get("base_unit"));
        String kind=required(body,"kind",20),reason=required(body,"reason",40);
        var reasons=switch(kind) { case "WASTE"->Set.of("EXPIRED","SPOILED","DAMAGED","PREP_LOSS","OVERPRODUCTION","OTHER"); case "USAGE"->Set.of("MEAL_PREPARATION"); case "COUNT_ADJUSTMENT"->Set.of("COUNT_DISCREPANCY"); default->throw new IllegalArgumentException("Choose waste, ordinary usage, or count discrepancy."); };
        if(!reasons.contains(reason))throw new IllegalArgumentException("Choose a reason matching this kind of stock removal.");
        var remaining=(BigDecimal)lot.get("remaining_quantity_base"); if(quantity.compareTo(remaining)>0)throw conflict("This removal exceeds the selected lot's remaining stock. Refresh and review it.");
        var before=stock.total(itemId); stock.database().update("UPDATE stock_lots SET remaining_quantity_base=remaining_quantity_base-? WHERE id=?",quantity,lotId);
        long event=stock.movement(itemId,lotId,kind,quantity.negate(),reason,optional(body,"note",2000),stock.optionalActor(body),key,hash);
        stock.mirror(item,before,before.subtract(quantity),"REDUCED",kind+": "+reason+"; lot "+lotId);
        return map("id",event,"lotId",lotId,"ingredientId",itemId,"stock",stock.ingredient(itemId));
    }
    @Transactional public Map<String,Object> saveNote(Map<String,Object> body) {
        return saveNote(null,body);
    }
    @Transactional public Map<String,Object> saveNote(Long noteId,Map<String,Object> body) {
        String type=required(body,"targetType",20),kind=required(body,"kind",30),text=required(body,"text",4000); long id=id(body,"targetId");
        if(type.equals("INGREDIENT"))stock.one("SELECT id FROM inventory_items WHERE id=?",id); else if(type.equals("RECIPE"))stock.one("SELECT id FROM prep_recipes WHERE id=?",id); else throw new IllegalArgumentException("Choose an ingredient or dish for this note.");
        if(!Set.of("HANDLING","APPROVED_SUBSTITUTION").contains(kind))throw new IllegalArgumentException("Choose handling or manager-approved substitution.");
        if(noteId==null)noteId=stock.insert("INSERT INTO guidance_notes(target_type,target_id,kind,note_text,actor,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",type,id,kind,text,stock.optionalActor(body),stock.now(),stock.now());
        else { stock.one("SELECT id FROM guidance_notes WHERE id=? FOR UPDATE",noteId); stock.database().update("UPDATE guidance_notes SET target_type=?,target_id=?,kind=?,note_text=?,actor=?,updated_at=? WHERE id=?",type,id,kind,text,stock.optionalActor(body),stock.now(),noteId); }
        return note(noteId);
    }
    Map<String,Object> note(long id) { var r=stock.one("SELECT * FROM guidance_notes WHERE id=?",id); String type=(String)r.get("target_type"); String table=type.equals("INGREDIENT")?"inventory_items":"prep_recipes"; String name=(String)stock.one("SELECT name FROM "+table+" WHERE id=?",r.get("target_id")).get("name"); return map("id",id,"targetType",type,"targetId",r.get("target_id"),"targetName",name,"kind",r.get("kind"),"text",r.get("note_text"),"actor",r.get("actor"),"createdAt",r.get("created_at").toString(),"updatedAt",r.get("updated_at").toString()); }
    @Transactional(readOnly=true) public List<Map<String,Object>> notes() { return stock.database().queryForList("SELECT id FROM guidance_notes ORDER BY updated_at DESC,id DESC LIMIT 200").stream().map(r->note(((Number)r.get("id")).longValue())).toList(); }
}
