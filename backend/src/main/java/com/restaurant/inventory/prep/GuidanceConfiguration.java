package com.restaurant.inventory.prep;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import jakarta.servlet.MultipartConfigElement;

@Configuration
public class GuidanceConfiguration {
    @Bean MultipartConfigElement multipartConfigElement() {
        // Let the controller validate/reject a just-over-limit photo so clients
        // receive the stable JSON 413 response instead of a parser-level reset.
        var factory=new MultipartConfigFactory(); factory.setMaxFileSize(DataSize.ofMegabytes(6)); factory.setMaxRequestSize(DataSize.ofMegabytes(7)); return factory.createMultipartConfig();
    }
}
