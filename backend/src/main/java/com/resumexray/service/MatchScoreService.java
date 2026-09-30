package com.resumexray.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumexray.dto.MatchResultResponse;
import com.resumexray.entity.MatchReport;
import com.resumexray.entity.Resume;
import com.resumexray.repository.MatchReportRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MatchScoreService {

    private final GroqClient groqClient;
    private final MatchReportRepository matchReportRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public MatchScoreService(GroqClient groqClient, MatchReportRepository matchReportRepository) {
        this.groqClient = groqClient;
        this.matchReportRepository = matchReportRepository;
    }

    private static final String SYSTEM_PROMPT = """
        You are an expert technical recruiter. Compare a candidate's resume text against a job description.
        Respond with ONLY a raw JSON object (no markdown, no code fences) in exactly this shape:
        {
          "matchScore": <integer 0-100>,
          "matchedSkills": ["skill1", "skill2"],
          "missingSkills": ["skill3", "skill4"],
          "reasoning": "2-3 sentence explanation of why the score is what it is, referencing specific matched and missing skills"
        }
        """;

    public MatchResultResponse analyze(Resume resume, String jobDescription) {
        String userPrompt = "RESUME:\n" + resume.getExtractedText() +
                "\n\nJOB DESCRIPTION:\n" + jobDescription;

        String rawJson = groqClient.promptForJson(SYSTEM_PROMPT, userPrompt);

        try {
            JsonNode node = mapper.readTree(rawJson);

            int score = node.path("matchScore").asInt();
            String reasoning = node.path("reasoning").asText();

            List<String> matched = new ArrayList<>();
            node.path("matchedSkills").forEach(n -> matched.add(n.asText()));

            List<String> missing = new ArrayList<>();
            node.path("missingSkills").forEach(n -> missing.add(n.asText()));

            MatchReport report = new MatchReport();
            report.setResume(resume);
            report.setJobDescription(jobDescription);
            report.setMatchScore(score);
            report.setMatchedSkills(String.join(",", matched));
            report.setMissingSkills(String.join(",", missing));
            report.setReasoning(reasoning);
            matchReportRepository.save(report);

            return new MatchResultResponse(report.getId(), score, matched, missing, reasoning);

        } catch (Exception e) {
            throw new RuntimeException("Could not parse AI response: " + e.getMessage(), e);
        }
    }
}
