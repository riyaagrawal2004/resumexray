package com.resumexray.controller;

import com.resumexray.dto.ApplicationView;
import com.resumexray.dto.CreateApplicationRequest;
import com.resumexray.dto.UpdateStatusRequest;
import com.resumexray.entity.Application;
import com.resumexray.entity.Resume;
import com.resumexray.entity.User;
import com.resumexray.repository.ApplicationRepository;
import com.resumexray.repository.ResumeRepository;
import com.resumexray.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Set<String> STATUSES =
            Set.of("APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED");

    private final ApplicationRepository applicationRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    public ApplicationController(ApplicationRepository applicationRepository,
                                 ResumeRepository resumeRepository,
                                 UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private static String normalizeStatus(String status) {
        String s = (status == null || status.isBlank()) ? "APPLIED" : status.trim().toUpperCase();
        if (!STATUSES.contains(s)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        return s;
    }

    @GetMapping
    public List<ApplicationView> list(Authentication authentication) {
        return applicationRepository.findViewsByUserId(currentUser(authentication).getId());
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateApplicationRequest req, Authentication authentication) {
        User user = currentUser(authentication);

        if (req.companyName() == null || req.companyName().isBlank()) {
            throw new IllegalArgumentException("Company name daalo.");
        }
        if (req.roleTitle() == null || req.roleTitle().isBlank()) {
            throw new IllegalArgumentException("Role / job title daalo.");
        }
        if (req.resumeId() == null || !resumeRepository.existsByIdAndUserId(req.resumeId(), user.getId())) {
            throw new IllegalArgumentException("Ek valid resume select karo.");
        }

        Resume resumeRef = resumeRepository.getReferenceById(req.resumeId());

        Application app = new Application();
        app.setUser(user);
        app.setResume(resumeRef);
        app.setCompanyName(req.companyName().trim());
        app.setRoleTitle(req.roleTitle().trim());
        app.setJobDescription(req.jobDescription());
        app.setJobLink(req.jobLink());
        app.setAppliedDate(req.appliedDate() != null ? req.appliedDate() : LocalDate.now());
        app.setStatus(normalizeStatus(req.status()));
        app.setNotes(req.notes());
        app.setMatchScore(req.matchScore());
        applicationRepository.save(app);

        return Map.of("id", app.getId());
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id,
                                            @RequestBody UpdateStatusRequest req,
                                            Authentication authentication) {
        User user = currentUser(authentication);
        Application app = applicationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (req.status() != null) {
            app.setStatus(normalizeStatus(req.status()));
        }
        if (req.notes() != null) {
            app.setNotes(req.notes());
        }
        applicationRepository.save(app);
        return Map.of("updated", true);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id, Authentication authentication) {
        User user = currentUser(authentication);
        Application app = applicationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        applicationRepository.delete(app);
        return Map.of("deleted", true);
    }
}
