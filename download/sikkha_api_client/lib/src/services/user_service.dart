import '../client.dart';
import '../models/models.dart';
import '../models/user.dart';

/// User-related API service (profile, dashboard, feedback, etc.).
class UserService {
  final SikkhaApiClient _client;

  UserService(this._client);

  /// Get the authenticated user's profile.
  Future<User> getProfile() async {
    final response = await _client.get<User>(
      '/api/user/profile',
      fromJson: (json) => User.fromJson(json['user'] as Map<String, dynamic>? ?? json),
    );
    return response.data!;
  }

  /// Update the authenticated user's profile.
  Future<User> updateProfile(ProfileUpdateRequest request) async {
    final response = await _client.patch<User>(
      '/api/user/profile',
      body: request.toJson(),
      requiresCsrf: true,
      fromJson: (json) => User.fromJson(json['user'] as Map<String, dynamic>? ?? json),
    );
    return response.data!;
  }

  /// Get user dashboard data.
  Future<DashboardData> getDashboard() async {
    final response = await _client.get<DashboardData>(
      '/api/user/dashboard',
      fromJson: DashboardData.fromJson,
    );
    return response.data!;
  }

  /// Get user subscriptions.
  Future<List<SubscriptionData>> getSubscriptions() async {
    final response = await _client.get<Map<String, dynamic>>(
      '/api/user/subscriptions',
    );
    final data = response.data as Map<String, dynamic>?;
    final subscriptions = data?['subscriptions'] as List? ?? [];
    return subscriptions
        .map((e) => SubscriptionData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get user payment history.
  Future<List<Payment>> getPayments({int page = 1, int limit = 20}) async {
    final response = await _client.get<List>(
      '/api/user/payments',
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
    final data = response.data;
    if (data is List) {
      return data.map((e) => Payment.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Get recently viewed lectures.
  Future<List<RecentLectureItem>> getRecentLectures() async {
    final response = await _client.get<List>(
      '/api/user/recent-lectures',
    );
    final data = response.data;
    if (data is List) {
      return data.map((e) => RecentLectureItem.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// List user feedback tickets.
  Future<List<FeedbackItem>> getFeedback({String? status, int page = 1, int limit = 20}) async {
    final queryParams = <String, String?>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (status != null) 'status': status,
    };
    final response = await _client.get<List>(
      '/api/user/feedback',
      queryParams: queryParams,
    );
    final data = response.data;
    if (data is List) {
      return data.map((e) => FeedbackItem.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Create a feedback ticket.
  Future<FeedbackItem> createFeedback({required String subject, required String message}) async {
    final response = await _client.post<FeedbackItem>(
      '/api/user/feedback',
      body: {'subject': subject, 'message': message},
      requiresCsrf: true,
      fromJson: FeedbackItem.fromJson,
    );
    return response.data!;
  }
}
