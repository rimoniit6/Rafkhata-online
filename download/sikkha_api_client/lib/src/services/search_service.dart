import '../client.dart';
import '../models/models.dart';

/// Search result model.
class SearchResult {
  final String query;
  final int total;
  final List<MCQ>? mcqs;
  final List<CQ>? cqs;
  final List<Lecture>? lectures;
  final List<Suggestion>? suggestions;
  final List<Notice>? notices;
  final List<Bundle>? bundles;

  SearchResult({
    this.query = '',
    this.total = 0,
    this.mcqs,
    this.cqs,
    this.lectures,
    this.suggestions,
    this.notices,
    this.bundles,
  });
}

/// Lightweight search item.
class SearchItem {
  final String id;
  final String title;
  final String type;
  final String? subtitle;
  final String? thumbnail;
  final bool isPremium;

  SearchItem({
    required this.id,
    required this.title,
    required this.type,
    this.subtitle,
    this.thumbnail,
    this.isPremium = false,
  });
}

/// Search API service.
class SearchService {
  final SikkhaApiClient _client;

  SearchService(this._client);

  /// Search across all content types.
  Future<SearchResult> search({
    required String query,
    String? type,
    int limit = 10,
  }) async {
    final params = <String, String?>{
      'q': query,
      if (type != null) 'type': type,
      'limit': limit.toString(),
    };

    final response = await _client.get<Map<String, dynamic>>(
      '/api/search',
      queryParams: params,
    );
    final data = response.data as Map<String, dynamic>? ?? {};

    return SearchResult(
      query: data['query'] as String? ?? query,
      total: (data['total'] as num?)?.toInt() ?? 0,
      mcqs: (data['results'] is Map ? (data['results'] as Map)['mcqs'] as List? : null)
          ?.map((e) => MCQ.fromJson(e as Map<String, dynamic>))
          .toList(),
      cqs: (data['results'] is Map ? (data['results'] as Map)['cqs'] as List? : null)
          ?.map((e) => CQ.fromJson(e as Map<String, dynamic>))
          .toList(),
      lectures: (data['results'] is Map ? (data['results'] as Map)['lectures'] as List? : null)
          ?.map((e) => Lecture.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
