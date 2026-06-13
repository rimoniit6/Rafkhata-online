import '../client.dart';
import '../models/models.dart';

/// Suggestion API service.
class SuggestionService {
  final SikkhaApiClient _client;

  SuggestionService(this._client);

  /// List suggestions with filters and pagination.
  Future<ApiResponse<List<Suggestion>>> getSuggestions({
    String? classId,
    String? subjectId,
    String? chapterId,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (classId != null) 'classId': classId,
      if (subjectId != null) 'subjectId': subjectId,
      if (chapterId != null) 'chapterId': chapterId,
      if (search != null) 'search': search,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/suggestions',
      queryParams: params,
    );
    final data = response.data;
    final suggestions = data is List
        ? data.map((e) => Suggestion.fromJson(e as Map<String, dynamic>)).toList()
        : <Suggestion>[];

    return ApiResponse<List<Suggestion>>(
      success: response.success,
      data: suggestions,
      pagination: response.pagination,
    );
  }

  /// Get a single suggestion by ID.
  Future<Suggestion> getSuggestion(String id) async {
    final response = await _client.get<Suggestion>(
      '/api/suggestions/$id',
      fromJson: Suggestion.fromJson,
    );
    return response.data!;
  }
}
