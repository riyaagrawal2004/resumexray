package com.resumexray.repository;

import com.resumexray.dto.ApplicationView;
import com.resumexray.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @Query("""
            select new com.resumexray.dto.ApplicationView(
                a.id, a.companyName, a.roleTitle, a.status, a.appliedDate, a.jobLink, a.notes, a.matchScore,
                r.id, r.label, r.originalFileName,
                case when r.fileData is not null then true else false end)
            from Application a join a.resume r
            where a.user.id = :userId
            order by a.appliedDate desc, a.id desc
            """)
    List<ApplicationView> findViewsByUserId(@Param("userId") Long userId);

    Optional<Application> findByIdAndUserId(Long id, Long userId);

    boolean existsByResumeId(Long resumeId);
}
