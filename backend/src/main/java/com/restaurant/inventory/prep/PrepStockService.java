package com.restaurant.inventory.prep;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Statement;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PrepStockService {
    final JdbcTemplate db;
    final Clock clock;
    final ObjectMapper json;
    public PrepStockService(JdbcTemplate db, Clock clock, ObjectMapper json) { this.db=db; this.clock=clock; this.json=json; }
    public JdbcTemplate database() { return db; }
    public ObjectMapper mapper() { return json; }
    public Clock kitchenClock() { return clock; }

    public List<Map<String,Object>> ingredients() {
        return db.queryForList("SELECT i.id FROM inventory_items i JOIN prep_ingredients p ON p.inventory_id=i.id ORDER BY i.name,i.id")
            .stream().map(row -> ingredient(((Number)row.get("id")).longValue())).toList();
    }
    public Map<String,Object> ingredient(long id) {
        var row = one("SELECT i.id,i.name,i.unit,p.base_unit,p.purchase_increment_base,p.version FROM inventory_items i JOIN prep_ingredients p ON p.inventory_id=i.id WHERE i.id=?",id);
        String unit=(String)row.get("unit");
        BigDecimal total=total(id);
        var result=map("id",id,"name",row.get("name"),"unit",unit,"baseUnit",row.get("base_unit"),"version",row.get("version"));
        if (row.get("base_unit").equals("UNKNOWN")) {
            result.put("onHand",Units.text(total)); result.put("conversionError","Legacy unit requires review: " + unit);
        } else {
            result.put("onHand",Units.text(Units.fromBase(total,unit)));
            result.put("purchaseIncrement",Units.text(Units.fromBase((BigDecimal)row.get("purchase_increment_base"),unit)));
        }
        result.put("lots",lots(id));
        return result;
    }
    public List<Map<String,Object>> lots(long id) {
        return db.queryForList("SELECT * FROM stock_lots WHERE inventory_id=? ORDER BY received_date,id",id).stream().map(row -> {
            var result=map("id",row.get("id"),"ingredientId",id,"receivedDate",row.get("received_date").toString(),"dateType",row.get("date_type"),"openingBalance",row.get("opening_balance"),"unitCost",Units.text((BigDecimal)row.get("unit_cost")),"inputUnit",row.get("input_unit"));
            result.put("labelDate",row.get("label_date")==null?null:row.get("label_date").toString());
            result.put("supplier",row.get("supplier"));
            String display=(String)one("SELECT unit FROM inventory_items WHERE id=?",id).get("unit");
            try { result.put("remaining",Units.text(Units.fromBase((BigDecimal)row.get("remaining_quantity_base"),display))); }
            catch (IllegalArgumentException ex) { result.put("remaining",Units.text((BigDecimal)row.get("remaining_quantity_base"))); }
            result.put("unit",display); return result;
        }).toList();
    }
    @Transactional
    public Map<String,Object> createIngredient(Map<String,Object> body) {
        String name=required(body,"name",120),unit=required(body,"unit",20);
        if (!Set.of("kg","g","L","ml","count").contains(unit)) throw new IllegalArgumentException("Choose kg, g, L, ml, or count.");
        if (db.queryForObject("SELECT COUNT(*) FROM inventory_items WHERE LOWER(name)=LOWER(?)",Integer.class,name)>0) throw conflict("An ingredient with this name already exists.");
        db.update("INSERT IGNORE INTO categories(name,description,is_active,created_at,updated_at) VALUES('Kitchen ingredients','Prep & Purchase',1,?,?)",now(),now());
        long category=((Number)one("SELECT id FROM categories WHERE name='Kitchen ingredients'").get("id")).longValue();
        long id=insert("INSERT INTO inventory_items(name,unit,quantity_in_stock,reorder_level,unit_price,category_id,created_at,updated_at) VALUES(?,?,0,0,0,?,?,?)",name,unit,category,now(),now());
        db.update("INSERT INTO prep_ingredients(inventory_id,base_unit) VALUES(?,?)",id,Units.baseUnit(unit));
        return ingredient(id);
    }
    @Transactional
    public Map<String,Object> receive(Map<String,Object> body) {
        long ingredientId=id(body,"ingredientId");
        var item=lockIngredient(ingredientId);
        String key=required(body,"requestKey",100),hash=hash(body);
        var replay=replay(key,hash); if (replay!=null) return replay;
        String unit=required(body,"unit",20),base=(String)item.get("base_unit");
        BigDecimal quantity=Units.toBase(decimal(body,"quantity",true,9),unit,base);
        BigDecimal cost=decimal(body,"unitCost",false,4);
        Long draftLine=body.get("draftLineId")==null?null:id(body,"draftLineId");
        if(draftLine!=null) {
            var line=one("SELECT * FROM draft_lines WHERE id=? AND inventory_id=? FOR UPDATE",draftLine,ingredientId);
            var outstanding=((BigDecimal)line.get("ordered_base")).subtract((BigDecimal)line.get("received_base"));
            if(quantity.compareTo(outstanding)>0)throw conflict("This receipt exceeds the draft line's outstanding quantity. Record any extra arrival as a separate receipt.");
        }
        LocalDate received=date(required(body,"receivedDate",10));
        if (received.isAfter(LocalDate.now(clock))) throw new IllegalArgumentException("An actual receipt cannot have a future received date.");
        String label=optional(body,"labelDate",10);
        LocalDate labelDate=label.isEmpty()?null:date(label);
        String dateType=required(body,"dateType",30);
        if (!Set.of("USE_BY","BEST_BEFORE","SUPPLIER_LABEL","UNKNOWN").contains(dateType)) throw new IllegalArgumentException("Unknown date type.");
        if (labelDate==null && !dateType.equals("UNKNOWN")) throw new IllegalArgumentException("Choose Unknown when no label date is recorded.");
        BigDecimal before=total(ingredientId);
        long lot=insert("INSERT INTO stock_lots(inventory_id,initial_quantity_base,remaining_quantity_base,input_unit,unit_cost,supplier,received_date,label_date,date_type,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",ingredientId,quantity,quantity,unit,cost,optional(body,"supplier",160),received,labelDate,dateType,now());
        long event=movement(ingredientId,lot,"RECEIPT",quantity,null,optional(body,"note",2000),optionalActor(body),key,hash);
        if(draftLine!=null) {
            db.update("UPDATE stock_lots SET draft_line_id=? WHERE id=?",draftLine,lot);
            db.update("UPDATE draft_lines SET received_base=received_base+? WHERE id=?",quantity,draftLine);
        }
        mirror(item,before,before.add(quantity),"ADDED","Received lot " + lot);
        return map("id",event,"lotId",lot,"ingredientId",ingredientId,"stock",ingredient(ingredientId));
    }
    public List<Map<String,Object>> history() {
        return db.queryForList("SELECT m.*,i.name,i.unit FROM stock_movements m JOIN inventory_items i ON i.id=m.inventory_id ORDER BY m.id DESC LIMIT 200").stream().map(row -> map("id",row.get("id"),"ingredient",row.get("name"),"kind",row.get("kind"),"quantity",Units.text(Units.fromBase(((BigDecimal)row.get("quantity_base")).abs(),(String)row.get("unit"))),"unit",row.get("unit"),"reason",row.get("reason"),"note",row.get("note"),"actor",row.get("actor"),"createdAt",row.get("created_at").toString(),"lotId",row.get("lot_id"))).toList();
    }
    Map<String,Object> lockIngredient(long id) {
        one("SELECT id FROM inventory_items WHERE id=? FOR UPDATE",id);
        return one("SELECT i.id,i.unit,p.base_unit FROM inventory_items i JOIN prep_ingredients p ON p.inventory_id=i.id WHERE i.id=?",id);
    }
    BigDecimal total(long id) { return db.queryForObject("SELECT COALESCE(SUM(remaining_quantity_base),0) FROM stock_lots WHERE inventory_id=?",BigDecimal.class,id); }
    long movement(long item,long lot,String kind,BigDecimal qty,String reason,String note,String actor,String key,String hash) {
        return insert("INSERT INTO stock_movements(inventory_id,lot_id,kind,quantity_base,reason,note,actor,request_key,payload_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",item,lot,kind,qty,reason,note,actor,key,hash,now());
    }
    void mirror(Map<String,Object> item,BigDecimal before,BigDecimal after,String type,String note) {
        long id=((Number)item.get("id")).longValue(); String unit=(String)item.get("unit");
        BigDecimal oldValue=Units.fromBase(before,unit),newValue=Units.fromBase(after,unit);
        db.update("UPDATE inventory_items SET quantity_in_stock=?,updated_at=? WHERE id=?",newValue,now(),id);
        db.update("UPDATE prep_ingredients SET version=version+1 WHERE inventory_id=?",id);
        db.update("INSERT INTO stock_history(inventory_item_id,change_type,previous_quantity,new_quantity,change_amount,notes,changed_at) VALUES(?,?,?,?,?,?,?)",id,type,oldValue,newValue,newValue.subtract(oldValue),note,now());
    }
    Map<String,Object> replay(String key,String hash) {
        var existing=db.queryForList("SELECT id,lot_id,inventory_id,payload_hash FROM stock_movements WHERE request_key=?",key);
        if (existing.isEmpty()) return null;
        var row=existing.getFirst(); if (!row.get("payload_hash").equals(hash)) throw conflict("This request key was already used for different content.");
        return map("id",row.get("id"),"lotId",row.get("lot_id"),"ingredientId",row.get("inventory_id"),"replayed",true);
    }
    Map<String,Object> one(String sql,Object...args) {
        var rows=db.queryForList(sql,args); if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found."); return rows.getFirst();
    }
    long insert(String sql,Object...args) {
        var keys=new GeneratedKeyHolder();
        db.update(connection -> { var statement=connection.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS); for(int i=0;i<args.length;i++) statement.setObject(i+1,args[i]); return statement; },keys);
        return keys.getKey().longValue();
    }
    static Map<String,Object> map(Object...pairs) { var result=new LinkedHashMap<String,Object>(); for(int i=0;i<pairs.length;i+=2)result.put((String)pairs[i],pairs[i+1]); return result; }
    static String required(Map<String,Object> body,String field,int max) { String value=optional(body,field,max); if(value.isBlank())throw new IllegalArgumentException(field + " is required."); return value; }
    static String optional(Map<String,Object> body,String field,int max) { Object raw=body.get(field); String value=raw==null?"":raw.toString().trim(); if(value.length()>max)throw new IllegalArgumentException(field+" is too long."); return value; }
    static BigDecimal decimal(Map<String,Object> body,String field,boolean positive,int scale) {
        String value=required(body,field,60);
        if(!value.matches("-?\\d+(\\.\\d+)?"))throw new IllegalArgumentException(field+" must be a decimal number.");
        BigDecimal number=new BigDecimal(value);
        if(number.scale()>scale || number.abs().compareTo(new BigDecimal("1000000000000"))>0 || number.signum()<0 || (positive&&number.signum()==0))throw new IllegalArgumentException(field+" must be "+(positive?"positive":"nonnegative")+" with at most "+scale+" decimal places.");
        return number;
    }
    static long id(Map<String,Object> body,String field) { try { long value=Long.parseLong(required(body,field,30)); if(value<1)throw new NumberFormatException(); return value; } catch(NumberFormatException ex){throw new IllegalArgumentException(field+" must be a valid ID.");} }
    static LocalDate date(String value) { try { return LocalDate.parse(value); } catch(Exception ex){throw new IllegalArgumentException("Enter a date as YYYY-MM-DD.");} }
    static ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT,message); }
    String optionalActor(Map<String,Object> body) { String actor=optional(body,"actor",120); return actor.isEmpty()?"Anita Rao (sample manager)":actor; }
    LocalDateTime now() { return LocalDateTime.now(clock); }
    String hash(Map<String,Object> body) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsString(new TreeMap<>(body)).getBytes(StandardCharsets.UTF_8))); }
        catch(Exception ex){throw new IllegalArgumentException("Invalid request content.");}
    }
}
