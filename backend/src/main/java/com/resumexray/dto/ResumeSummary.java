package com.resumexray.dto;

import java.time.Instant;

public record ResumeSummary(Long id, String label, String fileName, Instant uploadedAt, Boolean hasFile) {}
