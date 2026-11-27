package com.servicesphere.controller;

import com.servicesphere.dto.RegisterRequest;
import com.servicesphere.entity.User;
import com.servicesphere.repository.DepartmentRepository;
import com.servicesphere.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    private String resolveRoleName(Long roleId) {
        if (roleId == null) return "EMPLOYEE";
        return switch (roleId.intValue()) {
            case 2 -> "SUPPORT AGENT";
            case 3 -> "SUPPORT LEAD / MANAGER";
            case 4 -> "IT ASSET MANAGER";
            case 5 -> "ADMINISTRATOR";
            default -> "EMPLOYEE";
        };
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials != null ? credentials.get("email") : null;
        String rawPassword = credentials != null ? credentials.get("password") : null;

        if (email == null || email.trim().isEmpty() || rawPassword == null || rawPassword.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email and password are required"));
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email.trim());
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }

        User user = userOpt.get();

        if ("DISABLED".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account is disabled. Please contact an administrator."));
        }

        String hashedPassword = hashPassword(rawPassword);
        boolean passwordValid = user.getPasswordHash() != null
                && (user.getPasswordHash().equals(hashedPassword) || user.getPasswordHash().equals(rawPassword));

        if (!passwordValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", resolveRoleName(user.getRoleId()),
                "roleId", user.getRoleId()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (request == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Registration request is required"));
        }

        String fullName = request.normalizedFullName();
        String email = request.normalizedEmail();
        String rawPassword = request.effectivePassword();

        if (fullName.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Full name is required"));
        }

        if (email.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is required"));
        }

        if (!email.contains("@")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "A valid email address is required"));
        }

        if (rawPassword == null || rawPassword.trim().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Password must be at least 6 characters"));
        }

        if (userRepository.findByEmail(email).isPresent()
                || (request.email() != null && userRepository.findByEmail(request.email().trim()).isPresent())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is already registered"));
        }

        if (request.departmentId() != null && departmentRepository.findById(request.departmentId()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Selected department does not exist"));
        }

        User newUser = new User();
        newUser.setFullName(fullName);
        newUser.setEmail(email);
        newUser.setRoleId(1L);
        newUser.setStatus("ACTIVE");

        if (request.departmentId() != null) {
            newUser.setDepartmentId(request.departmentId());
        }

        newUser.setPasswordHash(hashPassword(rawPassword.trim()));

        User savedUser = userRepository.save(newUser);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Registration successful. Safe default Employee role assigned.");
        response.put("id", savedUser.getId());
        response.put("fullName", savedUser.getFullName());
        response.put("email", savedUser.getEmail());
        response.put("role", resolveRoleName(savedUser.getRoleId()));
        response.put("roleId", savedUser.getRoleId());
        if (savedUser.getDepartmentId() != null) {
            response.put("departmentId", savedUser.getDepartmentId());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email.trim());
        }
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Session expired or invalid"));
        }
        User user = userOpt.get();

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", resolveRoleName(user.getRoleId()),
                "roleId", user.getRoleId()
        ));
    }
}