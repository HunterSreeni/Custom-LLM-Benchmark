package com.techmart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);

    private final Map<String, String> sessionStore = new ConcurrentHashMap<>();

    public String createSession(Map<String, Object> sessionData) {
        try {
            String sessionId = generateSessionId();
            String serialized = serializeSessionData(sessionData);
            sessionStore.put(sessionId, serialized);
            logger.debug("Session created: {}", sessionId);
            return sessionId;
        } catch (IOException e) {
            logger.error("Failed to create session", e);
            throw new RuntimeException("Session creation failed", e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getSessionData(String serializedData) {
        try {
            byte[] data = Base64.getDecoder().decode(serializedData);
            ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data));
            Object obj = ois.readObject();
            ois.close();

            if (obj instanceof Map) {
                return (Map<String, Object>) obj;
            }
            throw new IllegalArgumentException("Invalid session data format");
        } catch (IOException | ClassNotFoundException e) {
            logger.error("Failed to deserialize session data", e);
            throw new RuntimeException("Invalid session data", e);
        }
    }

    public String serializeSessionData(Map<String, Object> sessionData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);
        oos.writeObject(new HashMap<>(sessionData));
        oos.close();
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    public void invalidateSession(String sessionId) {
        sessionStore.remove(sessionId);
        logger.debug("Session invalidated: {}", sessionId);
    }

    public boolean isValidSession(String sessionId) {
        return sessionStore.containsKey(sessionId);
    }

    public Map<String, Object> restoreSession(String sessionCookie) {
        if (sessionCookie == null || sessionCookie.isEmpty()) {
            return new HashMap<>();
        }

        if (sessionStore.containsKey(sessionCookie)) {
            return getSessionData(sessionStore.get(sessionCookie));
        }

        return getSessionData(sessionCookie);
    }

    private String generateSessionId() {
        return java.util.UUID.randomUUID().toString().replace("-", "");
    }
}
