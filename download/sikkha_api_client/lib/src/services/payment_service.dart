import '../client.dart';
import '../models/models.dart';
import '../models/payment.dart';

/// Payment & Purchase API service.
class PaymentService {
  final SikkhaApiClient _client;

  PaymentService(this._client);

  /// List payments for the authenticated user.
  Future<ApiResponse<List<Payment>>> getPayments({
    int page = 1,
    int limit = 20,
    String? status,
    String? contentType,
  }) async {
    final params = <String, String?>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (status != null) 'status': status,
      if (contentType != null) 'contentType': contentType,
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/payment',
      queryParams: params,
    );
    final data = response.data as Map<String, dynamic>?;
    final payments = (data?['payments'] as List? ?? [])
        .map((e) => Payment.fromJson(e as Map<String, dynamic>))
        .toList();

    return ApiResponse<List<Payment>>(
      success: response.success,
      data: payments,
      pagination: response.pagination,
    );
  }

  /// Create a payment request.
  Future<Payment> createPayment(PaymentRequest request) async {
    final response = await _client.post<Payment>(
      '/api/payment',
      body: request.toJson(),
      requiresCsrf: true,
      fromJson: (json) => Payment.fromJson(json['payment'] as Map<String, dynamic>? ?? json),
    );
    return response.data!;
  }

  /// Get payment detail.
  Future<Payment> getPayment(String id) async {
    final response = await _client.get<Payment>(
      '/api/payment/$id',
      fromJson: Payment.fromJson,
    );
    return response.data!;
  }

  /// Check content access.
  Future<AccessCheckResult> checkAccess({
    required String contentType,
    required String contentId,
    String? userId,
  }) async {
    final params = <String, String?>{
      'contentType': contentType,
      'contentId': contentId,
      if (userId != null) 'userId': userId,
    };

    final response = await _client.get<AccessCheckResult>(
      '/api/payment/check',
      queryParams: params,
      fromJson: AccessCheckResult.fromJson,
    );
    return response.data ?? AccessCheckResult();
  }

  /// Batch check content access.
  Future<List<BatchAccessCheckItem>> batchCheckAccess(List<ContentIdentifier> items) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/api/payment/batch-check',
      body: BatchAccessCheckRequest(items: items).toJson(),
      requiresCsrf: true,
    );
    final data = response.data as Map<String, dynamic>?;
    final resultItems = (data?['items'] as List? ?? [])
        .map((e) => BatchAccessCheckItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return resultItems;
  }

  /// Get content info for payment dialog.
  Future<ContentInfo> getContentInfo({
    required String contentType,
    required String contentId,
    String? classLevel,
  }) async {
    final params = <String, String?>{
      'contentType': contentType,
      'contentId': contentId,
      if (classLevel != null) 'classLevel': classLevel,
    };

    final response = await _client.get<ContentInfo>(
      '/api/payment/content-info',
      queryParams: params,
      fromJson: ContentInfo.fromJson,
    );
    return response.data!;
  }

  /// Get payment account numbers.
  Future<PaymentAccounts> getAccounts() async {
    final response = await _client.get<Map<String, dynamic>>('/api/payment/accounts');
    final data = response.data as Map<String, dynamic>?;
    final accounts = data?['accounts'] as Map<String, dynamic>? ?? {};
    return PaymentAccounts.fromJson(accounts);
  }

  /// Get user's purchase history.
  Future<List<Payment>> getPurchases({int page = 1, int limit = 20}) async {
    final params = <String, String?>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    final response = await _client.get<Map<String, dynamic>>(
      '/api/payment/purchases',
      queryParams: params,
    );
    final data = response.data as Map<String, dynamic>?;
    final purchases = (data?['purchases'] as List? ?? [])
        .map((e) => Payment.fromJson(e as Map<String, dynamic>))
        .toList();
    return purchases;
  }
}
