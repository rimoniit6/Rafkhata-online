import '../client.dart';
import '../models/models.dart';

/// Note model.
class Note {
  final String id;
  final String userId;
  final String contentId;
  final String contentType;
  final String content;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Note({
    required this.id,
    required this.userId,
    required this.contentId,
    required this.contentType,
    required this.content,
    this.createdAt,
    this.updatedAt,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    return Note(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      contentType: json['contentType'] as String? ?? '',
      content: json['content'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }
}

/// Notes API service.
class NoteService {
  final SikkhaApiClient _client;

  NoteService(this._client);

  /// List notes for the authenticated user.
  Future<ApiResponse<List<Note>>> getNotes({
    String? contentType,
    String? contentId,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String?>{
      if (contentType != null) 'contentType': contentType,
      if (contentId != null) 'contentId': contentId,
      'page': page.toString(),
      'limit': limit.toString(),
    };

    final response = await _client.get<List>(
      '/api/notes',
      queryParams: params,
    );
    final data = response.data;
    final notes = data is List
        ? data.map((e) => Note.fromJson(e as Map<String, dynamic>)).toList()
        : <Note>[];

    return ApiResponse<List<Note>>(
      success: response.success,
      data: notes,
      pagination: response.pagination,
    );
  }

  /// Create or update a note (upsert).
  Future<Note> upsertNote({
    required String contentId,
    required String contentType,
    required String content,
  }) async {
    final response = await _client.post<Note>(
      '/api/notes',
      body: {
        'contentId': contentId,
        'contentType': contentType,
        'content': content,
      },
      requiresCsrf: true,
      fromJson: Note.fromJson,
    );
    return response.data!;
  }
}
