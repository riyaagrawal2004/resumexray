package com.resumexray.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumexray.dto.BulletRewriteResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BulletRewriterService {

    private final GroqClient groqClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public BulletRewriterService(GroqClient groqClient) {
        this.groqClient = groqClient;
    }

    private static final String SYSTEM_PROMPT = """
        You are a resume writing expert. Given a candidate's existing resume bullet and a
        target job description, produce THREE rewritten versions of the bullet, each in a
        different style, that use the job description's own language/keywords while staying
        strictly truthful to the original achievement (never invent numbers or facts not
        present in the original).

        The three styles, in this order, are:
        1. "Metrics-focused" - leads with the quantifiable impact
        2. "Leadership-focused" - emphasizes ownership, collaboration or initiative shown
        3. "Concise" - the tightest, punchiest one-line version

        For each version also return: the specific job-description keywords/phrases you wove
        into it, and a relevanceScore (0-100) estimating how well that version now aligns with
        the job description compared to the original.

        Respond with ONLY a raw JSON object (no markdown, no code fences) in exactly this shape:
        {
          "variants": [
            {"style": "Metrics-focused", "text": "...", "keywordsUsed": ["...", "..."], "relevanceScore": 82},
            {"style": "Leadership-focused", "text": "...", "keywordsUsed": ["..."], "relevanceScore": 76},
            {"style": "Concise", "text": "...", "keywordsUsed": ["..."], "relevanceScore": 70}
          ]
        }
        """;

    public BulletRewriteResponse rewrite(String originalBullet, String jobDescription) {
        String userPrompt = "ORIGINAL BULLET:\n" + originalBullet +
                "\n\nJOB DESCRIPTION:\n" + jobDescription;

        String rawJson = groqClient.promptForJson(SYSTEM_PROMPT, userPrompt);

        try {
            JsonNode root = mapper.readTree(rawJson);
            List<BulletRewriteResponse.Variant> variants = new ArrayList<>();

            root.path("variants").forEach(v -> {
                List<String> keywords = new ArrayList<>();
                v.path("keywordsUsed").forEach(k -> keywords.add(k.asText()));

                variants.add(new BulletRewriteResponse.Variant(
                        v.path("style").asText(),
                        v.path("text").asText(),
                        keywords,
                        v.path("relevanceScore").asInt()
                ));
            });

            return new BulletRewriteResponse(variants);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse AI response: " + e.getMessage(), e);
        }
    }
}
