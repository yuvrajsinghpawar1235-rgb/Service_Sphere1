package com.servicesphere.config;

import com.servicesphere.entity.Department;
import com.servicesphere.entity.Role;
import com.servicesphere.entity.User;
import com.servicesphere.repository.DepartmentRepository;
import com.servicesphere.repository.RoleRepository;
import com.servicesphere.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {

    private static final String DEMO_PASSWORD = "pass123";

    private static final Map<String, String> DEFAULT_DEPARTMENTS = Map.of(
            "IT Support & Operations", "Service desk, infrastructure, and incident response",
            "Engineering", "Software engineering and platform systems",
            "Human Resources", "People operations, onboarding, and employee services",
            "Finance & Administration", "Accounting, procurement, and business operations",
            "Sales & Customer Success", "Client accounts, sales operations, and customer support"
    );

    private record DemoAccount(String fullName, String email, Long roleId) {}

    private static final List<DemoAccount> DEMO_ACCOUNTS = List.of(
            new DemoAccount("Demo Employee", "employee@servicesphere.com", 1L),
            new DemoAccount("Demo Support Agent", "agent@servicesphere.com", 2L),
            new DemoAccount("Demo Support Manager", "manager@servicesphere.com", 3L),
            new DemoAccount("Demo Asset Manager", "assetmanager@servicesphere.com", 4L),
            new DemoAccount("System Administrator", "admin@servicesphere.com", 5L)
    );

    private String hashSha256(String password) {
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

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository
    ) {
        return args -> {
            if (roleRepository.count() == 0) {
                roleRepository.save(new Role("EMPLOYEE", "Standard user / requester"));
                roleRepository.save(new Role("AGENT", "Support agent handling incidents"));
                roleRepository.save(new Role("MANAGER", "Support lead / manager"));
                roleRepository.save(new Role("ASSET_MANAGER", "IT asset manager"));
                roleRepository.save(new Role("ADMIN", "System administrator"));
            }

            DEFAULT_DEPARTMENTS.forEach((name, description) -> {
                if (departmentRepository.findByName(name).isEmpty()) {
                    departmentRepository.save(new Department(name, description));
                }
            });

            String hashedDemoPassword = hashSha256(DEMO_PASSWORD);
            for (DemoAccount account : DEMO_ACCOUNTS) {
                if (userRepository.findByEmail(account.email()).isEmpty()) {
                    User user = new User();
                    user.setFullName(account.fullName());
                    user.setEmail(account.email());
                    user.setPasswordHash(hashedDemoPassword);
                    user.setRoleId(account.roleId());
                    user.setStatus("ACTIVE");
                    userRepository.save(user);
                }
            }
        };
    }
}