package com.resumexray.dto;

import java.time.LocalDate;

public record ApplicationView(
        Long id,
        String companyName,
        String roleTitle,
        String status,
        LocalDate appliedDate,
        String jobLink,
        String notes,
        Integer matchScore,
        Long resumeId,
        String resumeLabel,
        String resumeFileName,
        Boolean resumeHasFile) {}
