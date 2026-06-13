import '../client.dart';
import '../models/models.dart';
import '../models/auth.dart';

/// Authentication API service.
class AuthService {
  final SikkhaApiClient _client;

  AuthService(this._client);

  /// Login with email and password.
  Future<User> login({required String email, required String password}) async {
    final response = await _client.post<LoginResponse>(
      '/api/auth/login',
      body: LoginRequest(email: email, password: password).toJson(),
      requiresCsrf: true,
      fromJson: LoginResponse.fromJson,
    );
    return response.data!.user;
  }

  /// Logout the current user.
  Future<void> logout() async {
    await _client.post('/api/auth/logout', requiresCsrf: true);
  }

  /// Get the currently authenticated user (or null if not logged in).
  Future<User?> getCurrentUser() async {
    try {
      final response = await _client.get<AuthCheckResponse>(
        '/api/auth/me',
        fromJson: AuthCheckResponse.fromJson,
      );
      return response.data?.user;
    } catch (_) {
      return null;
    }
  }

  /// Fetch a fresh CSRF token.
  Future<String> refreshCsrfToken() async {
    return _client.fetchCsrfToken();
  }
}
