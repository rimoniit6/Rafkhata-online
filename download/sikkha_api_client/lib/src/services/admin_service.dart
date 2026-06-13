import '../client.dart';
import '../models/models.dart';
import '../models/admin.dart';

/// Admin API service.
class AdminService {
  final SikkhaApiClient _client;

  AdminService(this._client);

  /// Get admin dashboard statistics.
  Future<AdminStats> getStats() async {
    final response = await _client.get<AdminStats>(
      '/api/admin/stats',
      fromJson: AdminStats.fromJson,
    );
    return response.data!;
  }

  /// List payments (admin view).
  Future<ApiResponse<List<Payment>>> getPayments({
    String? status,
    String? method,
    String? contentType,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (status != null) 'status': status,
      if (method != null) 'method': method,
      if (contentType != null) 'contentType': contentType,
      if (search != null) 'q': search,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/admin/payments',
      queryParams: params,
    );
    final data = response.data;
    final payments = data is List
        ? data.map((e) => Payment.fromJson(e as Map<String, dynamic>)).toList()
        : <Payment>[];

    return ApiResponse<List<Payment>>(
      success: response.success,
      data: payments,
      pagination: response.pagination,
    );
  }

  /// Review a payment (approve/reject).
  Future<void> reviewPayment(PaymentReviewRequest request) async {
    await _client.patch(
      '/api/admin/payments',
      body: request.toJson(),
      requiresCsrf: true,
    );
  }

  /// List users (admin view).
  Future<List> getUsers({
    String? role,
    bool? isPremium,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (role != null) 'role': role,
      if (isPremium != null) 'isPremium': isPremium.toString(),
      if (search != null) 'search': search,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/admin/users',
      queryParams: params,
    );
    return response.data is List ? response.data as List : [];
  }

  /// Update a user (admin).
  Future<void> updateUser(AdminUserUpdateRequest request) async {
    await _client.patch(
      '/api/admin/users',
      body: request.toJson(),
      requiresCsrf: true,
    );
  }

  /// Delete a user (admin).
  Future<void> deleteUser(String userId) async {
    await _client.delete(
      '/api/admin/users',
      queryParams: {'id': userId},
      requiresCsrf: true,
    );
  }
}
