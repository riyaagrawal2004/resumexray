package com.resumexray.dto;

public record RecommendationItem(Long resumeId, String label, int score, String reason) {}
