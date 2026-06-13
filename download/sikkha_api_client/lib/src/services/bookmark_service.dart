import '../client.dart';
import '../models/models.dart';

/// Bookmark model.
class Bookmark {
  final String id;
  final String contentId;
  final String contentType;
  final String? title;
  final DateTime? createdAt;

  Bookmark({
    required this.id,
    required this.contentId,
    required this.contentType,
    this.title,
    this.createdAt,
  });

  factory Bookmark.fromJson(Map<String, dynamic> json) {
    return Bookmark(
      id: json['id'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      contentType: json['contentType'] as String? ?? '',
      title: json['title'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

/// Bookmark API service.
class BookmarkService {
  final SikkhaApiClient _client;

  BookmarkService(this._client);

  /// List user's bookmarks.
  Future<ApiResponse<List<Bookmark>>> getBookmarks({
    String? contentType,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (contentType != null) 'contentType': contentType,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/bookmarks',
      queryParams: params,
    );
    final data = response.data as Map<String, dynamic>?;
    final bookmarks = (data?['bookmarks'] as List? ?? [])
        .map((e) => Bookmark.fromJson(e as Map<String, dynamic>))
        .toList();

    return ApiResponse<List<Bookmark>>(
      success: response.success,
      data: bookmarks,
    );
  }

  /// Add a bookmark.
  Future<void> addBookmark(String contentId, String contentType) async {
    await _client.post(
      '/api/bookmarks',
      body: {'contentId': contentId, 'contentType': contentType},
      requiresCsrf: true,
    );
  }

  /// Remove a bookmark.
  Future<void> removeBookmark(String contentId, String contentType) async {
    await _client.post(
      '/api/bookmarks',
      body: {'contentId': contentId, 'contentType': contentType},
      requiresCsrf: true,
    );
  }

  /// Check if content is bookmarked.
  Future<bool> isBookmarked(String contentId, String contentType) async {
    final response = await _client.get<Map<String, dynamic>>(
      '/api/bookmarks/check',
      queryParams: {'contentId': contentId, 'contentType': contentType},
    );
    final data = response.data as Map<String, dynamic>?;
    return data?['isBookmarked'] as bool? ?? false;
  }

  /// Batch check bookmarks.
  Future<Map<String, bool>> batchCheck(List<ContentIdentifier> items) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/api/bookmarks/batch-check',
      body: {'items': items.map((e) => e.toJson()).toList()},
      requiresCsrf: true,
    );
    final data = response.data as Map<String, dynamic>?;
    final resultItems = data?['items'] as List? ?? [];
    final map = <String, bool>{};
    for (final item in resultItems) {
      final ci = item as Map<String, dynamic>;
      final key = '${ci['contentType']}:${ci['contentId']}';
      map[key] = ci['isBookmarked'] as bool? ?? false;
    }
    return map;
  }
}
