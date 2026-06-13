import '../client.dart';
import '../models/models.dart';

/// Notice API service.
class NoticeService {
  final SikkhaApiClient _client;

  NoticeService(this._client);

  /// List notices with filters and pagination.
  Future<ApiResponse<List<Notice>>> getNotices({
    String? classLevel,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (classLevel != null) 'classLevel': classLevel,
      if (search != null) 'search': search,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/notices',
      queryParams: params,
    );
    final data = response.data;
    final notices = data is List
        ? data.map((e) => Notice.fromJson(e as Map<String, dynamic>)).toList()
        : <Notice>[];

    return ApiResponse<List<Notice>>(
      success: response.success,
      data: notices,
      pagination: response.pagination,
    );
  }
}
