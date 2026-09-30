package com.resumexray.dto;

import java.util.List;

public class MatchResultResponse {
    private Long reportId;
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String reasoning;

    public MatchResultResponse(Long reportId, int matchScore, List<String> matchedSkills,
                                List<String> missingSkills, String reasoning) {
        this.reportId = reportId;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.reasoning = reasoning;
    }

    public Long getReportId() { return reportId; }
    public int getMatchScore() { return matchScore; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public List<String> getMissingSkills() { return missingSkills; }
    public String getReasoning() { return reasoning; }
}
