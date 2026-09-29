package com.restaurant.inventory.prep;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static com.restaurant.inventory.prep.PrepStockService.*;

@Service
public class GuidanceEscalationService {
    private final PrepStockService stock; private final JdbcTemplate db;
    public GuidanceEscalationService(PrepStockService stock){this.stock=stock;this.db=stock.database();}
    @Transactional public Map<String,Object> create(Map<String,Object>b){long recipe=id(b,"recipeId");stock.one("SELECT id FROM prep_recipes WHERE id=? AND active=1",recipe);String date=required(b,"date",10),question=required(b,"question",2000),reported=required(b,"reportedBy",120),key=required(b,"requestKey",100);date(date);var payload=map("recipeId",recipe,"date",date,"question",question,"reportedBy",reported);String hash=stock.hash(payload);var prior=db.queryForList("SELECT id,payload_hash FROM guidance_escalations WHERE request_key=?",key);if(!prior.isEmpty()){if(!hash.equals(prior.getFirst().get("payload_hash")))throw conflict("This request key was already used for different content.");return shape(((Number)prior.getFirst().get("id")).longValue());}long id=stock.insert("INSERT INTO guidance_escalations(recipe_id,meal_date,question,reported_by,request_key,payload_hash,status,created_at) VALUES(?,?,?,?,?,?,'OPEN',?)",recipe,date(date),question,reported,key,hash,stock.now());return shape(id);}
    @Transactional(readOnly=true) public List<Map<String,Object>> list(){return db.queryForList("SELECT id FROM guidance_escalations ORDER BY created_at DESC,id DESC LIMIT 200").stream().map(r->shape(((Number)r.get("id")).longValue())).toList();}
    @Transactional public Map<String,Object> resolve(long id,Map<String,Object>b){String note=required(b,"resolutionNote",2000);stock.one("SELECT id FROM guidance_escalations WHERE id=? FOR UPDATE",id);db.update("UPDATE guidance_escalations SET status='RESOLVED',resolution_note=?,resolved_at=? WHERE id=?",note,stock.now(),id);return shape(id);}
    private Map<String,Object> shape(long id){var rows=db.queryForList("SELECT e.*,r.name recipe_name FROM guidance_escalations e JOIN prep_recipes r ON r.id=e.recipe_id WHERE e.id=?",id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found.");var r=rows.getFirst();return map("id",r.get("id"),"recipeId",r.get("recipe_id"),"recipeName",r.get("recipe_name"),"date",r.get("meal_date").toString(),"question",r.get("question"),"reportedBy",r.get("reported_by"),"requestKey",r.get("request_key"),"status",r.get("status"),"resolutionNote",r.get("resolution_note"),"createdAt",r.get("created_at").toString(),"resolvedAt",r.get("resolved_at")==null?null:r.get("resolved_at").toString());}
}
