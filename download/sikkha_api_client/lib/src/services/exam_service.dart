import '../client.dart';
import '../models/models.dart';
import '../models/exam.dart';

/// Exam API service.
class ExamService {
  final SikkhaApiClient _client;

  ExamService(this._client);

  /// List exams with filters.
  Future<ApiResponse<List<Exam>>> getExams({
    String? classLevel,
    String? subjectId,
    String? chapterId,
    String? type,
    String? query,
    int page = 1,
    int limit = 12,
  }) async {
    final params = <String, String?>{
      if (classLevel != null) 'classLevel': classLevel,
      if (subjectId != null) 'subjectId': subjectId,
      if (chapterId != null) 'chapterId': chapterId,
      if (type != null) 'type': type,
      if (query != null) 'q': query,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/exams',
      queryParams: params,
    );
    final data = response.data;
    final exams = data is List
        ? data.map((e) => Exam.fromJson(e as Map<String, dynamic>)).toList()
        : <Exam>[];

    return ApiResponse<List<Exam>>(
      success: response.success,
      data: exams,
      pagination: response.pagination,
    );
  }

  /// Get exam detail with questions.
  Future<ExamDetail> getExam(String id, {bool showAnswers = false}) async {
    final response = await _client.get<ExamDetail>(
      '/api/exams/$id',
      queryParams: showAnswers ? {'showAnswers': 'true'} : null,
      fromJson: ExamDetail.fromJson,
    );
    return response.data!;
  }

  /// Submit exam result.
  Future<ExamResult> submitResult(ExamResultRequest request) async {
    final response = await _client.post<ExamResult>(
      '/api/exams/results',
      body: request.toJson(),
      requiresCsrf: true,
      fromJson: ExamResult.fromJson,
    );
    return response.data!;
  }

  /// Get MCQ exam packages.
  Future<List<MCQExamPackage>> getMCQExamPackages() async {
    final response = await _client.get<List>('/api/mcq-exam-packages');
    final data = response.data;
    if (data is List) {
      return data.map((e) => MCQExamPackage.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Get CQ exam packages.
  Future<List<CQExamPackage>> getCQExamPackages() async {
    final response = await _client.get<List>('/api/cq-exam-packages');
    final data = response.data;
    if (data is List) {
      return data.map((e) => CQExamPackage.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
