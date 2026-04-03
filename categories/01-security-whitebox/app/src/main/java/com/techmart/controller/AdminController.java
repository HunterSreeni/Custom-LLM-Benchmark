package com.techmart.controller;

import com.techmart.model.User;
import com.techmart.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> listAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id,
                                                @RequestBody Map<String, String> payload) {
        User user = userService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String roleName = payload.get("role");
        user.setRole(User.Role.valueOf(roleName.toUpperCase()));
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("maxUsersPerPage", 50);
        settings.put("enableRegistration", true);
        settings.put("maintenanceMode", false);
        settings.put("smtpHost", "smtp.techmart.internal");
        settings.put("smtpPort", 587);
        settings.put("databasePoolSize", 20);
        settings.put("cacheEnabled", true);
        settings.put("sessionTimeoutMinutes", 30);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> settings) {
        return ResponseEntity.ok(settings);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getUserCount());
        stats.put("activeUsers", userService.getAllUsers().stream()
                .filter(User::isActive).count());
        stats.put("adminCount", userService.getUsersByRole(User.Role.ADMIN).size());
        return ResponseEntity.ok(stats);
    }
}
