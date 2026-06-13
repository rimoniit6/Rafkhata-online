import '../client.dart';
import '../models/models.dart';
import '../models/cq.dart';

/// CQ (Creative Question) API service.
class CQService {
  final SikkhaApiClient _client;

  CQService(this._client);

  /// Get CQs in normal mode (full data with pagination).
  Future<ApiResponse<List<CQ>>> getCQs({
    String? chapterId,
    String? classLevel,
    String? subjectId,
    String? difficulty,
    String? board,
    String? year,
    bool? isPremium,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String?>{
      if (chapterId != null) 'chapterId': chapterId,
      if (classLevel != null) 'classLevel': classLevel,
      if (subjectId != null) 'subjectId': subjectId,
      if (difficulty != null) 'difficulty': difficulty,
      if (board != null) 'board': board,
      if (year != null) 'year': year,
      if (isPremium != null) 'isPremium': isPremium.toString(),
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/cq',
      queryParams: queryParams,
    );
    final data = response.data as Map<String, dynamic>?;
    final cqs = (data?['cqs'] as List? ?? [])
        .map((e) => CQ.fromJson(e as Map<String, dynamic>))
        .toList();

    return ApiResponse<List<CQ>>(
      success: response.success,
      data: cqs,
      pagination: response.pagination,
    );
  }

  /// Get CQs in list mode (lightweight, paginated).
  Future<ApiResponse<CQListResponse>> getCQList({
    String? chapterId,
    String? classLevel,
    String? subjectId,
    String? difficulty,
    String? board,
    String? year,
    bool? isPremium,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String?>{
      'type': 'list',
      if (chapterId != null) 'chapterId': chapterId,
      if (classLevel != null) 'classLevel': classLevel,
      if (subjectId != null) 'subjectId': subjectId,
      if (difficulty != null) 'difficulty': difficulty,
      if (board != null) 'board': board,
      if (year != null) 'year': year,
      if (isPremium != null) 'isPremium': isPremium.toString(),
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<CQListResponse>(
      '/api/cq',
      queryParams: queryParams,
      fromJson: CQListResponse.fromJson,
    );

    return ApiResponse<CQListResponse>(
      success: response.success,
      data: response.data,
      pagination: response.pagination,
    );
  }

  /// Get a single CQ by ID.
  Future<CQ> getCQ(String id) async {
    final response = await _client.get<CQ>(
      '/api/cq/$id',
      fromJson: CQ.fromJson,
    );
    return response.data!;
  }
}
