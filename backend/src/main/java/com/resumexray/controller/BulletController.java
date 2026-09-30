package com.resumexray.controller;

import com.resumexray.dto.BulletRewriteRequest;
import com.resumexray.dto.BulletRewriteResponse;
import com.resumexray.service.BulletRewriterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bullet")
public class BulletController {

    private final BulletRewriterService bulletRewriterService;

    public BulletController(BulletRewriterService bulletRewriterService) {
        this.bulletRewriterService = bulletRewriterService;
    }

    @PostMapping("/rewrite")
    public ResponseEntity<BulletRewriteResponse> rewrite(@RequestBody BulletRewriteRequest request) {
        BulletRewriteResponse result = bulletRewriterService.rewrite(request.getOriginalBullet(), request.getJobDescription());
        return ResponseEntity.ok(result);
    }
}
