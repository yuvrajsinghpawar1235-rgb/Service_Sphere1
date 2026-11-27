package com.servicesphere.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must not exceed 120 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String email,

        @Size(min = 6, max = 128, message = "Password must be between 6 and 128 characters")
        String password,

        @Size(min = 6, max = 128, message = "Password must be between 6 and 128 characters")
        String passwordHash, // Optional fallback if a client sends passwordHash instead of password

        @Positive(message = "Department ID must be a positive number")
        Long departmentId // Optional department selection
) {
    /**
     * Resolves the raw password from either `password` or `passwordHash`.
     */
    public String effectivePassword() {
        if (password != null && !password.isBlank()) {
            return password;
        }
        if (passwordHash != null && !passwordHash.isBlank()) {
            return passwordHash;
        }
        return null;
    }

    /**
     * Returns trimmed fullName or an empty string if null.
     */
    public String normalizedFullName() {
        return fullName != null ? fullName.trim() : "";
    }

    /**
     * Returns trimmed, lowercased email or an empty string if null.
     */
    public String normalizedEmail() {
        return email != null ? email.trim().toLowerCase() : "";
    }
}