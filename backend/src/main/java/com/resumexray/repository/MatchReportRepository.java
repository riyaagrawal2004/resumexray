package com.resumexray.repository;

import com.resumexray.entity.MatchReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchReportRepository extends JpaRepository<MatchReport, Long> {
    List<MatchReport> findByResumeIdOrderByCreatedAtDesc(Long resumeId);
}
