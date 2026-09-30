package com.resumexray.controller;

import com.resumexray.dto.RoadmapRequest;
import com.resumexray.dto.RoadmapResponse;
import com.resumexray.service.RoadmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roadmap")
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    @PostMapping("/generate")
    public ResponseEntity<RoadmapResponse> generate(@RequestBody RoadmapRequest request) {
        return ResponseEntity.ok(roadmapService.generate(request.getMissingSkills()));
    }
}
