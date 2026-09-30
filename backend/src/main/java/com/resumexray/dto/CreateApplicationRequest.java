package com.resumexray.dto;

import java.time.LocalDate;

public record CreateApplicationRequest(
        Long resumeId,
        String companyName,
        String roleTitle,
        String jobDescription,
        String jobLink,
        LocalDate appliedDate,
        String status,
        String notes,
        Integer matchScore) {}
