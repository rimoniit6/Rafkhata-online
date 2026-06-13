/// Suggestion model.
class Suggestion {
  final String id;
  final String title;
  final String? slug;
  final String? classId;
  final String? subjectId;
  final String? chapterId;
  final String? className;
  final String? subjectName;
  final String? chapterName;
  final String? thumbnail;
  final String? pdfUrl;
  final bool isPremium;
  final double price;
  final int viewCount;
  final int order;
  final DateTime? createdAt;
  final String? content;

  Suggestion({
    required this.id,
    required this.title,
    this.slug,
    this.classId,
    this.subjectId,
    this.chapterId,
    this.className,
    this.subjectName,
    this.chapterName,
    this.thumbnail,
    this.pdfUrl,
    this.isPremium = false,
    this.price = 0,
    this.viewCount = 0,
    this.order = 0,
    this.createdAt,
    this.content,
  });

  factory Suggestion.fromJson(Map<String, dynamic> json) {
    return Suggestion(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String?,
      classId: json['classId'] as String?,
      subjectId: json['subjectId'] as String?,
      chapterId: json['chapterId'] as String?,
      className: json['className'] as String?,
      subjectName: json['subjectName'] as String?,
      chapterName: json['chapterName'] as String?,
      thumbnail: json['thumbnail'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      order: (json['order'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      content: json['content'] as String?,
    );
  }
}

/// Bundle model.
class Bundle {
  final String id;
  final String title;
  final String? slug;
  final String? description;
  final String? thumbnail;
  final double price;
  final double? originalPrice;
  final bool isPremium;
  final int? discount;
  final String? classLevel;
  final String? type;
  final int order;

  Bundle({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.thumbnail,
    this.price = 0,
    this.originalPrice,
    this.isPremium = false,
    this.discount,
    this.classLevel,
    this.type,
    this.order = 0,
  });

  factory Bundle.fromJson(Map<String, dynamic> json) {
    return Bundle(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      thumbnail: json['thumbnail'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      isPremium: json['isPremium'] as bool? ?? false,
      discount: (json['discount'] as num?)?.toInt(),
      classLevel: json['classLevel'] as String?,
      type: json['type'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}
