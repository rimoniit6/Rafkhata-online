/// Progress record for a content item.
class Progress {
  final String id;
  final String contentId;
  final String contentType;
  final double progress;
  final DateTime? lastAccessed;
  final String? title;

  Progress({
    required this.id,
    required this.contentId,
    required this.contentType,
    this.progress = 0,
    this.lastAccessed,
    this.title,
  });

  factory Progress.fromJson(Map<String, dynamic> json) {
    return Progress(
      id: json['id'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      contentType: json['contentType'] as String? ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      lastAccessed: json['lastAccessed'] != null
          ? DateTime.tryParse(json['lastAccessed'] as String)
          : null,
      title: json['title'] as String?,
    );
  }
}
