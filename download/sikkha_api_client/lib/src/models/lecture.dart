/// Lecture model.
class Lecture {
  final String id;
  final String title;
  final String? content;
  final String? thumbnail;
  final String? videoUrl;
  final String? audioUrl;
  final String? pdfUrl;
  final String chapterName;
  final String subjectName;
  final String className;
  final String classSlug;
  final String subjectId;
  final String chapterId;
  final bool isPremium;
  final double price;
  final int duration;
  final int order;
  final double progress;
  final List<LectureResource> resources;

  Lecture({
    required this.id,
    required this.title,
    this.content,
    this.thumbnail,
    this.videoUrl,
    this.audioUrl,
    this.pdfUrl,
    this.chapterName = '',
    this.subjectName = '',
    this.className = '',
    this.classSlug = '',
    this.subjectId = '',
    this.chapterId = '',
    this.isPremium = false,
    this.price = 0,
    this.duration = 0,
    this.order = 0,
    this.progress = 0,
    this.resources = const [],
  });

  factory Lecture.fromJson(Map<String, dynamic> json) {
    return Lecture(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      thumbnail: json['thumbnail'] as String?,
      videoUrl: json['videoUrl'] as String?,
      audioUrl: json['audioUrl'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      chapterName: json['chapterName'] as String? ?? '',
      subjectName: json['subjectName'] as String? ?? '',
      className: json['className'] as String? ?? '',
      classSlug: json['classSlug'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      order: (json['order'] as num?)?.toInt() ?? 0,
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      resources: (json['resources'] as List? ?? [])
          .map((e) => LectureResource.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Lecture resource (PDF, video, etc.).
class LectureResource {
  final String name;
  final String url;
  final String type;

  LectureResource({required this.name, required this.url, required this.type});

  factory LectureResource.fromJson(Map<String, dynamic> json) {
    return LectureResource(
      name: json['name'] as String? ?? '',
      url: json['url'] as String? ?? '',
      type: json['type'] as String? ?? '',
    );
  }
}

/// Lecture detail (with sibling lectures).
class LectureDetail {
  final Lecture lecture;
  final List<SiblingLecture> lectures;
  final int currentIndex;

  LectureDetail({
    required this.lecture,
    this.lectures = const [],
    this.currentIndex = 0,
  });

  factory LectureDetail.fromJson(Map<String, dynamic> json) {
    final lecture = Lecture.fromJson(json);
    return LectureDetail(
      lecture: lecture,
      lectures: (json['lectures'] as List? ?? [])
          .map((e) => SiblingLecture.fromJson(e as Map<String, dynamic>))
          .toList(),
      currentIndex: (json['currentIndex'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Sibling lecture (in the same chapter).
class SiblingLecture {
  final String id;
  final String title;
  final int number;
  final bool isCompleted;
  final bool isCurrent;

  SiblingLecture({
    required this.id,
    required this.title,
    this.number = 0,
    this.isCompleted = false,
    this.isCurrent = false,
  });

  factory SiblingLecture.fromJson(Map<String, dynamic> json) {
    return SiblingLecture(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      number: (json['number'] as num?)?.toInt() ?? 0,
      isCompleted: json['isCompleted'] as bool? ?? false,
      isCurrent: json['isCurrent'] as bool? ?? false,
    );
  }
}
