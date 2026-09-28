package com.restaurant.inventory.prep;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Existing history remains readable; every current stock write uses the lot ledger. */
@Component
public class LegacyWriteGuard extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String path=request.getServletPath(),method=request.getMethod();
        if(path.startsWith("/api/")&&!path.startsWith("/api/prep/")&&!method.equals("GET")&&!method.equals("OPTIONS")) {
            response.setStatus(409); response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Use the Prep & Purchase workflow so lots and history stay consistent.\"}"); return;
        }
        chain.doFilter(request,response);
    }
}
