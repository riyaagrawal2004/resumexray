package com.resumexray.controller;

import com.resumexray.dto.RecommendRequest;
import com.resumexray.dto.RecommendationItem;
import com.resumexray.dto.ResumeSummary;
import com.resumexray.entity.Resume;
import com.resumexray.entity.User;
import com.resumexray.repository.ApplicationRepository;
import com.resumexray.repository.ResumeRepository;
import com.resumexray.repository.UserRepository;
import com.resumexray.service.PdfTextExtractor;
import com.resumexray.service.ResumeRecommendService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final PdfTextExtractor pdfTextExtractor;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ResumeRecommendService recommendService;

    public ResumeController(PdfTextExtractor pdfTextExtractor,
                            ResumeRepository resumeRepository,
                            ApplicationRepository applicationRepository,
                            UserRepository userRepository,
                            ResumeRecommendService recommendService) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.recommendService = recommendService;
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /** Upload a PDF. If a label is given it becomes part of the user's resume library. */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file,
                                                        @RequestParam(value = "label", required = false) String label,
                                                        Authentication authentication) {
        User user = currentUser(authentication);
        String text = pdfTextExtractor.extractText(file);

        Resume resume = new Resume();
        resume.setUser(user);
        resume.setExtractedText(text);
        resume.setOriginalFileName(file.getOriginalFilename());
        resume.setLabel(label != null && !label.isBlank() ? label.trim() : null);
        try {
            resume.setFileData(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Could not read uploaded file: " + e.getMessage(), e);
        }
        resumeRepository.save(resume);

        return ResponseEntity.ok(Map.of(
                "resumeId", resume.getId(),
                "extractedText", text
        ));
    }

    /** The user's resume library (only labelled resumes). */
    @GetMapping
    public List<ResumeSummary> list(Authentication authentication) {
        return resumeRepository.findSummariesByUserId(currentUser(authentication).getId());
    }

    /** Download the exact PDF that was uploaded. */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id, Authentication authentication) {
        User user = currentUser(authentication);
        Resume resume = resumeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (resume.getFileData() == null) {
            return ResponseEntity.notFound().build();
        }

        String name = resume.getOriginalFileName() != null ? resume.getOriginalFileName() : "resume.pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
                .body(resume.getFileData());
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id, Authentication authentication) {
        User user = currentUser(authentication);
        if (!resumeRepository.existsByIdAndUserId(id, user.getId())) {
            throw new IllegalArgumentException("Resume not found");
        }
        if (applicationRepository.existsByResumeId(id)) {
            throw new IllegalArgumentException("Is resume se applications linked hain - pehle wo applications delete karo.");
        }
        resumeRepository.deleteById(id);
        return Map.of("deleted", true);
    }

    /** Which of my resume versions should I send for this job? */
    @PostMapping("/recommend")
    public List<RecommendationItem> recommend(@RequestBody RecommendRequest request, Authentication authentication) {
        return recommendService.recommend(currentUser(authentication).getId(), request.jobDescription());
    }
}
