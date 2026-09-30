package com.resumexray.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumexray.dto.RecommendationItem;
import com.resumexray.entity.Resume;
import com.resumexray.repository.ResumeRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Given a job description, ranks ALL of the user's saved resume versions
 * and tells them which one to send.
 */
@Service
public class ResumeRecommendService {

    private static final int MAX_RESUME_CHARS = 2500;
    private static final int MAX_JD_CHARS = 3000;

    private final GroqClient groqClient;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public ResumeRecommendService(GroqClient groqClient, ResumeRepository resumeRepository) {
        this.groqClient = groqClient;
        this.resumeRepository = resumeRepository;
    }

    private static final String SYSTEM_PROMPT = """
        You are an expert technical recruiter. A candidate keeps several versions of their resume,
        each identified by a RESUME_ID and a label. Given a job description, decide which resume
        version is the best one to send for this job.

        Score EVERY resume from 0 to 100 for how well it matches the job description, and give a
        one-sentence reason that names specific skills/projects that match or are missing.

        Respond with ONLY a raw JSON object (no markdown, no code fences) in exactly this shape:
        {"rankings":[{"resumeId": 1, "score": 85, "reason": "..."}]}
        Include every resume exactly once.
        """;

    public List<RecommendationItem> recommend(Long userId, String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank()) {
            throw new IllegalArgumentException("Job description khaali hai - pehle JD paste karo.");
        }

        List<Resume> resumes = resumeRepository.findByUserIdAndLabelIsNotNullOrderByIdDesc(userId);
        if (resumes.isEmpty()) {
            throw new IllegalArgumentException("Abhi koi resume saved nahi hai - pehle 'My Resumes' tab me apne resumes upload karo.");
        }

        StringBuilder prompt = new StringBuilder("JOB DESCRIPTION:\n")
                .append(trunc(jobDescription, MAX_JD_CHARS))
                .append("\n\n=== RESUMES ===\n");
        for (Resume r : resumes) {
            prompt.append("RESUME_ID: ").append(r.getId()).append('\n')
                  .append("LABEL: ").append(r.getLabel()).append('\n')
                  .append("TEXT:\n").append(trunc(r.getExtractedText(), MAX_RESUME_CHARS))
                  .append("\n---\n");
        }

        String rawJson = groqClient.promptForJson(SYSTEM_PROMPT, prompt.toString());

        try {
            Map<Long, Resume> byId = resumes.stream()
                    .collect(Collectors.toMap(Resume::getId, Function.identity()));

            List<RecommendationItem> items = new ArrayList<>();
            JsonNode root = mapper.readTree(rawJson);
            for (JsonNode n : root.path("rankings")) {
                Resume r = byId.get(n.path("resumeId").asLong());
                if (r == null) continue;
                items.add(new RecommendationItem(
                        r.getId(),
                        r.getLabel(),
                        n.path("score").asInt(),
                        n.path("reason").asText()));
            }
            items.sort(Comparator.comparingInt(RecommendationItem::score).reversed());
            return items;
        } catch (Exception e) {
            throw new RuntimeException("AI ka response samajh nahi aaya, ek baar phir try karo. (" + e.getMessage() + ")", e);
        }
    }

    private static String trunc(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }
}
