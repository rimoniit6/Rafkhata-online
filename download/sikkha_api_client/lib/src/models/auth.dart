import 'user.dart';

/// Login request body.
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

/// Login response data.
class LoginResponse {
  final User user;

  LoginResponse({required this.user});

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

/// Auth check response data.
class AuthCheckResponse {
  final User user;

  AuthCheckResponse({required this.user});

  factory AuthCheckResponse.fromJson(Map<String, dynamic> json) {
    return AuthCheckResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

/// CSRF token response.
class CsrfTokenResponse {
  final String token;

  CsrfTokenResponse({required this.token});

  factory CsrfTokenResponse.fromJson(Map<String, dynamic> json) {
    return CsrfTokenResponse(
      token: json['token'] as String? ?? '',
    );
  }
}
