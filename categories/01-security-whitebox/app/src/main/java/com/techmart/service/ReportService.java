package com.techmart.service;

import com.techmart.dto.ReportRequest;
import com.techmart.model.Report;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    @Value("${techmart.reports.output-dir:./reports}")
    private String outputDirectory;

    @Value("${techmart.reports.default-header-image:classpath:static/images/header-default.png}")
    private String defaultHeaderImage;

    public Report generateReport(ReportRequest request, Long userId) {
        Report report = new Report();
        report.setTitle(request.getTitle());
        report.setReportType(request.getReportType());
        report.setGeneratedBy(userId);
        report.setStatus(Report.ReportStatus.GENERATING);

        try {
            String outputPath = buildOutputPath(request);
            byte[] headerImage = fetchHeaderImage(request.getHeaderImageUrl());

            generatePdfContent(report, request, headerImage, outputPath);

            report.setFilePath(outputPath);
            report.setStatus(Report.ReportStatus.COMPLETED);
            report.setCompletedAt(LocalDateTime.now());
            logger.info("Report generated successfully: {}", outputPath);
        } catch (Exception e) {
            report.setStatus(Report.ReportStatus.FAILED);
            logger.error("Failed to generate report: {}", e.getMessage(), e);
        }

        return report;
    }

    private byte[] fetchHeaderImage(String headerImageUrl) throws IOException {
        if (headerImageUrl == null || headerImageUrl.trim().isEmpty()) {
            return loadDefaultHeaderImage();
        }

        logger.info("Fetching header image from: {}", headerImageUrl);
        URL url = new URL(headerImageUrl);
        try (InputStream inputStream = url.openStream();
             ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {

            byte[] data = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, bytesRead);
            }
            buffer.flush();

            byte[] imageBytes = buffer.toByteArray();
            if (imageBytes.length > 5 * 1024 * 1024) {
                throw new IOException("Header image exceeds maximum size of 5MB");
            }

            return imageBytes;
        }
    }

    private byte[] loadDefaultHeaderImage() throws IOException {
        Path defaultPath = Paths.get("src/main/resources/static/images/header-default.png");
        if (Files.exists(defaultPath)) {
            return Files.readAllBytes(defaultPath);
        }
        return new byte[0];
    }

    private String buildOutputPath(ReportRequest request) throws IOException {
        Path outputDir = Paths.get(outputDirectory);
        if (!Files.exists(outputDir)) {
            Files.createDirectories(outputDir);
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = String.format("%s_%s_%s.%s",
                request.getReportType().name().toLowerCase(),
                timestamp,
                UUID.randomUUID().toString().substring(0, 8),
                request.getOutputFormat().toLowerCase());

        return outputDir.resolve(filename).toString();
    }

    private void generatePdfContent(Report report, ReportRequest request,
                                     byte[] headerImage, String outputPath) throws IOException {
        Path path = Paths.get(outputPath);
        try (OutputStream out = Files.newOutputStream(path)) {
            if (headerImage != null && headerImage.length > 0) {
                out.write(headerImage);
            }

            String content = buildReportContent(request);
            out.write(content.getBytes());
        }
    }

    private String buildReportContent(ReportRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("TechMart Report: ").append(request.getTitle()).append("\n");
        sb.append("Type: ").append(request.getReportType()).append("\n");
        sb.append("Generated: ").append(LocalDateTime.now()).append("\n");
        sb.append("Date Range: ").append(request.getDateRangeStart())
                .append(" to ").append(request.getDateRangeEnd()).append("\n");
        sb.append("\n--- Report Data ---\n");
        return sb.toString();
    }
}
