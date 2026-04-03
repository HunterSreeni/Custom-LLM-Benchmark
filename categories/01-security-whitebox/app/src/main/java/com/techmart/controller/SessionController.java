package com.techmart.controller;

import com.techmart.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/session")
public class SessionController {

    private static final String SESSION_COOKIE_NAME = "TECHMART_SESSION";

    @Autowired
    private SessionService sessionService;

    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createSession(@RequestBody Map<String, Object> sessionData,
                                                              HttpServletResponse response) {
        String sessionId = sessionService.createSession(sessionData);

        Cookie cookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
        cookie.setPath("/");
        cookie.setMaxAge(1800);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);

        Map<String, String> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("status", "created");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSessionInfo(HttpServletRequest request) {
        String sessionCookie = extractSessionCookie(request);
        if (sessionCookie == null) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> sessionData = sessionService.restoreSession(sessionCookie);
        return ResponseEntity.ok(sessionData);
    }

    @PostMapping("/restore")
    public ResponseEntity<Map<String, Object>> restoreSession(@RequestBody Map<String, String> payload) {
        String sessionData = payload.get("sessionData");
        if (sessionData == null || sessionData.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> restored = sessionService.getSessionData(sessionData);
        return ResponseEntity.ok(restored);
    }

    @PostMapping("/invalidate")
    public ResponseEntity<Void> invalidateSession(HttpServletRequest request,
                                                    HttpServletResponse response) {
        String sessionCookie = extractSessionCookie(request);
        if (sessionCookie != null) {
            sessionService.invalidateSession(sessionCookie);

            Cookie cookie = new Cookie(SESSION_COOKIE_NAME, "");
            cookie.setPath("/");
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        }
        return ResponseEntity.noContent().build();
    }

    private String extractSessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
