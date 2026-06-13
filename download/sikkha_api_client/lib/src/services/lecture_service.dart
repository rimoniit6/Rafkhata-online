import '../client.dart';
import '../models/models.dart';
import '../models/lecture.dart';

/// Lecture API service.
class LectureService {
  final SikkhaApiClient _client;

  LectureService(this._client);

  /// Get lectures with pagination.
  Future<ApiResponse<List<Lecture>>> getLectures({
    String? chapterId,
    String? subjectId,
    String? classLevel,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String?>{
      if (chapterId != null) 'chapterId': chapterId,
      if (subjectId != null) 'subjectId': subjectId,
      if (classLevel != null) 'classLevel': classLevel,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/lectures',
      queryParams: queryParams,
    );
    final data = response.data as Map<String, dynamic>?;
    final lectures = (data?['lectures'] as List? ?? [])
        .map((e) => Lecture.fromJson(e as Map<String, dynamic>))
        .toList();

    return ApiResponse<List<Lecture>>(
      success: response.success,
      data: lectures,
      pagination: response.pagination,
    );
  }

  /// Get a single lecture detail with sibling lectures.
  Future<LectureDetail> getLecture(String id) async {
    final response = await _client.get<LectureDetail>(
      '/api/lectures/$id',
      fromJson: LectureDetail.fromJson,
    );
    return response.data!;
  }
}
