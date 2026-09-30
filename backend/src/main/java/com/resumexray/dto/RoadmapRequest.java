package com.resumexray.dto;

import java.util.List;

public class RoadmapRequest {
    private List<String> missingSkills;

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
}
