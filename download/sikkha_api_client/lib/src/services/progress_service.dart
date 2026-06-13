import '../client.dart';
import '../models/models.dart';

/// Progress API service.
class ProgressService {
  final SikkhaApiClient _client;

  ProgressService(this._client);

  /// Get progress records.
  Future<List<Progress>> getProgress({
    String? contentType,
    String? contentId,
  }) async {
    final params = <String, String?>{
      if (contentType != null) 'contentType': contentType,
      if (contentId != null) 'contentId': contentId,
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/progress',
      queryParams: params,
    );
    final data = response.data as Map<String, dynamic>?;
    final progressList = (data?['progress'] as List? ?? [])
        .map((e) => Progress.fromJson(e as Map<String, dynamic>))
        .toList();
    return progressList;
  }

  /// Update progress for a content item.
  Future<void> updateProgress({
    required String contentId,
    required String contentType,
    required double progress,
  }) async {
    await _client.post(
      '/api/progress',
      body: {
        'contentId': contentId,
        'contentType': contentType,
        'progress': progress,
      },
      requiresCsrf: true,
    );
  }
}
