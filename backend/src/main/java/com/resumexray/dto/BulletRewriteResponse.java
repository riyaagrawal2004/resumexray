package com.resumexray.dto;

import java.util.List;

public class BulletRewriteResponse {

    public static class Variant {
        public String style;          // e.g. "Metrics-focused"
        public String text;           // the rewritten bullet
        public List<String> keywordsUsed; // JD keywords woven in
        public int relevanceScore;    // 0-100

        public Variant(String style, String text, List<String> keywordsUsed, int relevanceScore) {
            this.style = style;
            this.text = text;
            this.keywordsUsed = keywordsUsed;
            this.relevanceScore = relevanceScore;
        }
    }

    private List<Variant> variants;

    public BulletRewriteResponse(List<Variant> variants) {
        this.variants = variants;
    }

    public List<Variant> getVariants() { return variants; }
}
