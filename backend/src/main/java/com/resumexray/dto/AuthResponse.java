package com.resumexray.dto;

public class AuthResponse {
    private String token;
    private String fullName;
    private String email;

    public AuthResponse(String token, String fullName, String email) {
        this.token = token;
        this.fullName = fullName;
        this.email = email;
    }

    public String getToken() { return token; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
}
