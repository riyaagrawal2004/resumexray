package com.resumexray.repository;

import com.resumexray.dto.ResumeSummary;
import com.resumexray.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// Read-only transaction on the whole interface: PostgreSQL needs a transaction to read @Lob text columns.
@Transactional(readOnly = true)
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByUserId(Long userId);

    @Query("""
            select new com.resumexray.dto.ResumeSummary(
                r.id, r.label, r.originalFileName, r.uploadedAt,
                case when r.fileData is not null then true else false end)
            from Resume r
            where r.user.id = :userId and r.label is not null
            order by r.id desc
            """)
    List<ResumeSummary> findSummariesByUserId(@Param("userId") Long userId);

    List<Resume> findByUserIdAndLabelIsNotNullOrderByIdDesc(Long userId);

    Optional<Resume> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
