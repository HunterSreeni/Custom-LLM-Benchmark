package com.techmart.controller;

import com.techmart.dto.ReportRequest;
import com.techmart.model.Report;
import com.techmart.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@Valid @RequestBody ReportRequest request,
                                                  Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        Report report = reportService.generateReport(request, userId);

        if (report.getStatus() == Report.ReportStatus.FAILED) {
            return ResponseEntity.internalServerError().body(report);
        }

        return ResponseEntity.ok(report);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Report> getReport(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() != null) {
            return 1L;
        }
        return 0L;
    }
}
