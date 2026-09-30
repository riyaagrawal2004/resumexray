package com.resumexray.dto;

import java.util.List;

public class RoadmapResponse {
    public static class Week {
        public String label;
        public String title;
        public String description;
        public Week(String label, String title, String description) {
            this.label = label; this.title = title; this.description = description;
        }
    }

    private List<Week> weeks;

    public RoadmapResponse(List<Week> weeks) { this.weeks = weeks; }
    public List<Week> getWeeks() { return weeks; }
}
