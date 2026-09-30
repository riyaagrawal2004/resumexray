package com.resumexray.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumexray.dto.RoadmapResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoadmapService {

    private final GroqClient groqClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public RoadmapService(GroqClient groqClient) {
        this.groqClient = groqClient;
    }

    private static final String SYSTEM_PROMPT = """
        You are a career mentor. Given a list of missing skills for a job applicant,
        create a realistic 4-week learning roadmap to close those gaps.
        Respond with ONLY a raw JSON object (no markdown) in exactly this shape:
        {
          "weeks": [
            {"label": "Week 1", "title": "short title", "description": "one sentence, concrete and actionable"},
            {"label": "Week 2", "title": "...", "description": "..."},
            {"label": "Week 3", "title": "...", "description": "..."},
            {"label": "Week 4", "title": "...", "description": "..."}
          ]
        }
        """;

    public RoadmapResponse generate(List<String> missingSkills) {
        String userPrompt = "Missing skills: " + String.join(", ", missingSkills);
        String rawJson = groqClient.promptForJson(SYSTEM_PROMPT, userPrompt);

        try {
            JsonNode root = mapper.readTree(rawJson);
            List<RoadmapResponse.Week> weeks = new ArrayList<>();

            root.path("weeks").forEach(w -> weeks.add(new RoadmapResponse.Week(
                    w.path("label").asText(),
                    w.path("title").asText(),
                    w.path("description").asText()
            )));

            return new RoadmapResponse(weeks);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse AI response: " + e.getMessage(), e);
        }
    }
}
