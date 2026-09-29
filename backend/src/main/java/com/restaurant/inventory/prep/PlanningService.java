package com.restaurant.inventory.prep;

import java.math.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.restaurant.inventory.prep.PrepStockService.*;

@Service
public class PlanningService {
    private static final List<String> MEAL_SLOTS=List.of("BREAKFAST","LUNCH","DINNER");
    private static final DateTimeFormatter MEAL_TIME_FORMAT=DateTimeFormatter.ofPattern("HH:mm").withResolverStyle(ResolverStyle.STRICT);
    final PrepStockService stock;
    public PlanningService(PrepStockService stock) { this.stock=stock; }
    @Transactional(readOnly=true) public List<Map<String,Object>> recipes() {
        return stock.database().queryForList("SELECT id FROM prep_recipes WHERE active=1 ORDER BY name,id").stream().map(x->recipe(((Number)x.get("id")).longValue())).toList();
    }
    Map<String,Object> recipe(long id) {
        var r=stock.one("SELECT * FROM prep_recipes WHERE id=?",id);
        var lines=stock.database().queryForList("SELECT r.*,i.name,p.base_unit FROM recipe_ingredients r JOIN inventory_items i ON i.id=r.inventory_id JOIN prep_ingredients p ON p.inventory_id=i.id WHERE recipe_id=? ORDER BY inventory_id",id).stream().map(l->map("ingredientId",l.get("inventory_id"),"name",l.get("name"),"quantity",Units.text(Units.fromBase((BigDecimal)l.get("quantity_base"),(String)l.get("input_unit"))),"unit",l.get("input_unit"))).toList();
        return map("id",id,"name",r.get("name"),"active",r.get("active"),"ingredients",lines);
    }
    @Transactional public Map<String,Object> saveRecipe(Long id,Map<String,Object> body) {
        String name=required(body,"name",120);
        if(!(body.get("ingredients") instanceof List<?> lines) || lines.isEmpty() || lines.size()>50)throw new IllegalArgumentException("A recipe needs 1 to 50 ingredient lines.");
        var validated=new ArrayList<Map<String,Object>>(); var seen=new HashSet<Long>();
        for(Object raw:lines) {
            if(!(raw instanceof Map<?,?>))throw new IllegalArgumentException("Invalid recipe line.");
            var line=(Map<String,Object>)raw; long item=id(line,"ingredientId");
            if(!seen.add(item))throw new IllegalArgumentException("Use each ingredient once per recipe.");
            var ingredient=stock.one("SELECT base_unit FROM prep_ingredients WHERE inventory_id=?",item);
            String unit=required(line,"unit",20); var quantity=Units.toBase(decimal(line,"quantity",true,9),unit,(String)ingredient.get("base_unit"));
            validated.add(map("id",item,"quantity",quantity,"unit",unit));
        }
        if(id==null)id=stock.insert("INSERT INTO prep_recipes(name,updated_at) VALUES(?,?)",name,stock.now());
        else { stock.one("SELECT id FROM prep_recipes WHERE id=? AND active=1 FOR UPDATE",id); stock.database().update("UPDATE prep_recipes SET name=?,updated_at=? WHERE id=?",name,stock.now(),id); stock.database().update("DELETE FROM recipe_ingredients WHERE recipe_id=?",id); }
        for(var l:validated)stock.database().update("INSERT INTO recipe_ingredients(recipe_id,inventory_id,quantity_base,input_unit) VALUES(?,?,?,?)",id,l.get("id"),l.get("quantity"),l.get("unit"));
        return recipe(id);
    }
    @Transactional public void archiveRecipe(long id) {
        stock.one("SELECT id FROM prep_recipes WHERE id=? FOR UPDATE",id);
        if(stock.database().queryForObject("SELECT COUNT(*) FROM meal_plans WHERE recipe_id=?",Integer.class,id)>0)throw conflict("Remove this dish from its meal plans before archiving it.");
        stock.database().update("UPDATE prep_recipes SET active=0,updated_at=? WHERE id=?",stock.now(),id);
    }
    @Transactional(readOnly=true) public List<Map<String,Object>> plans(String date) {
        LocalDate mealDate=date(date);
        return stock.database().queryForList("SELECT p.*,r.name FROM meal_plans p JOIN prep_recipes r ON r.id=p.recipe_id WHERE meal_date=? ORDER BY p.id",mealDate).stream().map(p->planDto(p)).toList();
    }
    @Transactional public Map<String,Object> savePlan(Long planId,Map<String,Object> body) {
        long recipeId=id(body,"recipeId"); stock.one("SELECT id FROM prep_recipes WHERE id=? AND active=1",recipeId);
        LocalDate date=date(required(body,"date",10)); long portions=id(body,"portions"); if(portions>100000)throw new IllegalArgumentException("Portions must be a whole number from 1 to 100000.");
        String existingSlot=planId==null?null:(String)stock.one("SELECT meal_slot FROM meal_plans WHERE id=? FOR UPDATE",planId).get("meal_slot");
        String mealSlot=body.containsKey("mealSlot")?checkedSlot(body.get("mealSlot"),true):planId==null?"UNASSIGNED":existingSlot;
        if(planId==null)planId=stock.insert("INSERT INTO meal_plans(recipe_id,meal_date,portions,meal_slot,updated_at) VALUES(?,?,?,?,?)",recipeId,date,portions,mealSlot,stock.now());
        else stock.database().update("UPDATE meal_plans SET recipe_id=?,meal_date=?,portions=?,meal_slot=?,updated_at=? WHERE id=?",recipeId,date,portions,mealSlot,stock.now(),planId);
        return map("id",planId);
    }
    @Transactional(readOnly=true) public Map<String,Object> mealTimes(LocalDate date) {
        var result=map("BREAKFAST","08:00","LUNCH","13:00","DINNER","20:00");
        for(var row:stock.database().queryForList("SELECT meal_slot,serve_time FROM meal_service_times WHERE meal_date=?",date))
            result.put((String)row.get("meal_slot"),formatTime(row.get("serve_time")));
        return result;
    }
    @Transactional public Map<String,Object> saveMealTime(Map<String,Object> body) {
        LocalDate date=date(required(body,"date",10));
        String slot=checkedSlot(body.get("mealSlot"),false);
        Object incoming=body.get("serveTime");
        if(!(incoming instanceof String value) || !value.matches("[0-9]{2}:[0-9]{2}")) throw new IllegalArgumentException("serveTime must use 24-hour HH:mm format.");
        LocalTime time;
        try { time=LocalTime.parse(value,MEAL_TIME_FORMAT); }
        catch(DateTimeParseException ex) { throw new IllegalArgumentException("serveTime must use 24-hour HH:mm format."); }
        stock.database().update("INSERT INTO meal_service_times(meal_date,meal_slot,serve_time) VALUES(?,?,?) ON DUPLICATE KEY UPDATE serve_time=VALUES(serve_time)",date,slot,time);
        return map("date",date.toString(),"mealTimes",mealTimes(date));
    }
    @Transactional(readOnly=true) public Map<String,Object> calendar(String startText) {
        LocalDate start=date(startText),end=start.plusDays(6); var days=new ArrayList<Map<String,Object>>();
        for(LocalDate day=start;!day.isAfter(end);day=day.plusDays(1)) days.add(map("date",day.toString(),"plans",plans(day.toString()),"mealTimes",mealTimes(day)));
        return map("start",start.toString(),"end",end.toString(),"days",days);
    }
    private Map<String,Object> planDto(Map<String,Object> p) {
        String slot=(String)p.get("meal_slot"); LocalDate day=asDate(p.get("meal_date"));
        return map("id",p.get("id"),"recipeId",p.get("recipe_id"),"name",p.get("name"),"date",day.toString(),"portions",p.get("portions"),"mealSlot",slot,"serveTime",slot.equals("UNASSIGNED")?null:mealTimes(day).get(slot));
    }
    private LocalDate asDate(Object value) { return value instanceof LocalDate d?d:LocalDate.parse(value.toString()); }
    private String checkedSlot(Object value,boolean allowUnassigned) {
        List<String> allowed=allowUnassigned?List.of("BREAKFAST","LUNCH","DINNER","UNASSIGNED"):MEAL_SLOTS;
        if(!(value instanceof String slot)||!allowed.contains(slot)) throw new IllegalArgumentException("mealSlot must be one of "+String.join(", ",allowed)+".");
        return slot;
    }
    private String formatTime(Object value) {
        LocalTime time=value instanceof LocalTime t?t:value instanceof java.sql.Time t?t.toLocalTime():LocalTime.parse(value.toString());
        return time.format(MEAL_TIME_FORMAT);
    }
    @Transactional public void deletePlan(long id) { stock.one("SELECT id FROM meal_plans WHERE id=? FOR UPDATE",id); stock.database().update("DELETE FROM meal_plans WHERE id=?",id); }
    @Transactional public Map<String,Object> settings(long id,Map<String,Object> body) {
        var ingredient=stock.lockIngredient(id); String unit=required(body,"unit",20),base=(String)ingredient.get("base_unit");
        var buffer=Units.toBase(decimal(body,"buffer",false,9),unit,base); var increment=Units.toBase(decimal(body,"increment",false,9),unit,base); LocalDate date=date(required(body,"date",10));
        stock.database().update("INSERT INTO planning_buffers(inventory_id,meal_date,quantity_base) VALUES(?,?,?) ON DUPLICATE KEY UPDATE quantity_base=VALUES(quantity_base)",id,date,buffer);
        stock.database().update("UPDATE prep_ingredients SET purchase_increment_base=?,version=version+1 WHERE inventory_id=?",increment,id);
        return map("saved",true);
    }
    @Transactional(readOnly=true) public Map<String,Object> estimate(String dateText) {
        LocalDate mealDate=date(dateText); var plans=plans(dateText); var lines=new ArrayList<Map<String,Object>>();
        var requirements=stock.database().queryForList("SELECT ri.inventory_id,SUM(ri.quantity_base*p.portions) required FROM meal_plans p JOIN recipe_ingredients ri ON ri.recipe_id=p.recipe_id WHERE p.meal_date=? GROUP BY ri.inventory_id ORDER BY ri.inventory_id",mealDate);
        for(var req:requirements) {
            long id=((Number)req.get("inventory_id")).longValue(); var item=stock.one("SELECT i.name,i.unit,p.base_unit,p.purchase_increment_base,p.version FROM inventory_items i JOIN prep_ingredients p ON p.inventory_id=i.id WHERE i.id=?",id);
            String unit=(String)item.get("unit"); var lots=stock.database().queryForList("SELECT * FROM stock_lots WHERE inventory_id=? ORDER BY id",id);
            BigDecimal excluded=BigDecimal.ZERO,unknown=BigDecimal.ZERO,onHand=BigDecimal.ZERO;
            var review=new ArrayList<Map<String,Object>>();
            for(var lot:lots) {
                var qty=(BigDecimal)lot.get("remaining_quantity_base"); onHand=onHand.add(qty);
                Object label=lot.get("label_date"); boolean passed=label!=null&&LocalDate.parse(label.toString()).isBefore(mealDate);
                if(passed)excluded=excluded.add(qty);
                if(label==null || lot.get("date_type").equals("UNKNOWN"))unknown=unknown.add(qty);
                if(qty.signum()>0&&(passed || label==null || lot.get("date_type").equals("UNKNOWN")))review.add(map("lotId",lot.get("id"),"quantity",display(qty,unit),"labelDate",label==null?null:label.toString(),"dateType",lot.get("date_type"),"excluded",passed));
            }
            var rows=stock.database().queryForList("SELECT quantity_base FROM planning_buffers WHERE inventory_id=? AND meal_date=?",id,mealDate);
            var buffer=rows.isEmpty()?BigDecimal.ZERO:(BigDecimal)rows.getFirst().get("quantity_base"); var required=(BigDecimal)req.get("required"); var usable=onHand.subtract(excluded); var raw=required.add(buffer).subtract(usable).max(BigDecimal.ZERO); var increment=(BigDecimal)item.get("purchase_increment_base"); var rounded=increment.signum()>0?raw.divide(increment,0,RoundingMode.CEILING).multiply(increment):raw;
            var breakdown=stock.database().queryForList("SELECT r.name,p.portions,ri.quantity_base FROM meal_plans p JOIN prep_recipes r ON r.id=p.recipe_id JOIN recipe_ingredients ri ON ri.recipe_id=p.recipe_id WHERE p.meal_date=? AND ri.inventory_id=? ORDER BY p.id",mealDate,id).stream().map(b->map("dish",b.get("name"),"portions",b.get("portions"),"perServing",display((BigDecimal)b.get("quantity_base"),unit),"required",display(((BigDecimal)b.get("quantity_base")).multiply(new BigDecimal(b.get("portions").toString())),unit))).toList();
            lines.add(map("ingredientId",id,"name",item.get("name"),"unit",unit,"version",item.get("version"),"required",display(required,unit),"onHand",display(onHand,unit),"excluded",display(excluded,unit),"usable",display(usable,unit),"buffer",display(buffer,unit),"increment",display(increment,unit),"rawSuggestion",display(raw,unit),"suggested",display(rounded,unit),"unknownDateStock",display(unknown,unit),"reviewLots",review,"breakdown",breakdown));
        }
        var legacyPlans=plans.stream().map(p->map("id",p.get("id"),"recipeId",p.get("recipeId"),"name",p.get("name"),"date",p.get("date"),"portions",p.get("portions"))).toList();
        var fingerprintInput=map("date",dateText,"plans",legacyPlans,"lines",lines);
        var result=map("date",dateText,"plans",plans,"lines",lines,"fingerprint",stock.hash(fingerprintInput)); return result;
    }
    static String display(BigDecimal quantity,String unit) { return Units.text(Units.fromBase(quantity,unit)); }
}
