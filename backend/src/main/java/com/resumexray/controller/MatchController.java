package com.resumexray.controller;

import com.resumexray.dto.AnalyzeRequest;
import com.resumexray.dto.MatchResultResponse;
import com.resumexray.entity.Resume;
import com.resumexray.entity.User;
import com.resumexray.repository.ResumeRepository;
import com.resumexray.repository.UserRepository;
import com.resumexray.service.MatchScoreService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/match")
public class MatchController {

    private final MatchScoreService matchScoreService;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    public MatchController(MatchScoreService matchScoreService, ResumeRepository resumeRepository,
                            UserRepository userRepository) {
        this.matchScoreService = matchScoreService;
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
    }

    /**
     * Analyzes the most recently uploaded resume for this user against a job description.
     * (Kept simple - a production version would take an explicit resumeId.)
     */
    @PostMapping("/analyze")
    public ResponseEntity<MatchResultResponse> analyze(@Valid @RequestBody AnalyzeRequest request,
                                                         Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save the pasted resume text as a Resume record so history/roadmap can reference it.
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setExtractedText(request.getResumeText());
        resume.setOriginalFileName("pasted-text");
        resumeRepository.save(resume);

        MatchResultResponse result = matchScoreService.analyze(resume, request.getJobDescription());
        return ResponseEntity.ok(result);
    }
}
