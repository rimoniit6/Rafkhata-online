import '../client.dart';
import '../models/models.dart';
import '../models/mcq.dart';

/// MCQ API service.
class MCQService {
  final SikkhaApiClient _client;

  MCQService(this._client);

  /// Get MCQs in normal mode (full data with pagination).
  Future<ApiResponse<List<MCQ>>> getMCQs({
    String? chapterId,
    String? classLevel,
    String? subjectId,
    String? difficulty,
    String? board,
    String? year,
    bool? isPremium,
    int page = 1,
    int limit = 500,
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
      '/api/mcq',
      queryParams: queryParams,
    );
    final data = response.data as Map<String, dynamic>?;
    final questions = (data?['questions'] as List? ?? [])
        .map((e) => MCQ.fromJson(e as Map<String, dynamic>))
        .toList();

    return ApiResponse<List<MCQ>>(
      success: response.success,
      data: questions,
      pagination: response.pagination,
    );
  }

  /// Get MCQs in list mode (lightweight, paginated).
  Future<ApiResponse<MCQListResponse>> getMCQList({
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

    final response = await _client.get<MCQListResponse>(
      '/api/mcq',
      queryParams: queryParams,
      fromJson: MCQListResponse.fromJson,
    );

    return ApiResponse<MCQListResponse>(
      success: response.success,
      data: response.data,
      pagination: response.pagination,
    );
  }

  /// Get MCQs in exam mode (shuffled, no answers).
  Future<MCQExamResponse> getMCQsForExam({
    String? chapterId,
    String? classLevel,
    String? subjectId,
    String? difficulty,
    String? board,
    String? year,
  }) async {
    final queryParams = <String, String?>{
      'type': 'exam',
      if (chapterId != null) 'chapterId': chapterId,
      if (classLevel != null) 'classLevel': classLevel,
      if (subjectId != null) 'subjectId': subjectId,
      if (difficulty != null) 'difficulty': difficulty,
      if (board != null) 'board': board,
      if (year != null) 'year': year,
    };

    final response = await _client.get<MCQExamResponse>(
      '/api/mcq',
      queryParams: queryParams,
      fromJson: MCQExamResponse.fromJson,
    );
    return response.data ?? MCQExamResponse();
  }

  /// Get a single MCQ by ID.
  Future<MCQ> getMCQ(String id) async {
    final response = await _client.get<MCQ>(
      '/api/mcq/$id',
      fromJson: MCQ.fromJson,
    );
    return response.data!;
  }
}
