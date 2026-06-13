/// CQ (Creative Question) model.
class CQ {
  final String id;
  final String uddeepok;
  final String? uddeepokImage;
  final List<CQSubQuestion> questions;
  final String chapterName;
  final String subjectName;
  final String className;
  final String classSlug;
  final String subjectId;
  final String chapterId;
  final bool isPremium;
  final double price;
  final String difficulty;
  final String? year;
  final String? board;
  final bool hasAccess;

  CQ({
    required this.id,
    required this.uddeepok,
    this.uddeepokImage,
    this.questions = const [],
    this.chapterName = '',
    this.subjectName = '',
    this.className = '',
    this.classSlug = '',
    this.subjectId = '',
    this.chapterId = '',
    this.isPremium = false,
    this.price = 0,
    this.difficulty = 'medium',
    this.year,
    this.board,
    this.hasAccess = true,
  });

  factory CQ.fromJson(Map<String, dynamic> json) {
    return CQ(
      id: json['id'] as String? ?? '',
      uddeepok: json['uddeepok'] as String? ?? '',
      uddeepokImage: json['uddeepokImage'] as String?,
      questions: (json['questions'] as List? ?? [])
          .map((e) => CQSubQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
      chapterName: json['chapterName'] as String? ?? '',
      subjectName: json['subjectName'] as String? ?? '',
      className: json['className'] as String? ?? '',
      classSlug: json['classSlug'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      difficulty: json['difficulty'] as String? ?? 'medium',
      year: json['year'] as String?,
      board: json['board'] as String?,
      hasAccess: json['hasAccess'] as bool? ?? true,
    );
  }
}

/// CQ sub-question (ক, খ, গ, ঘ).
class CQSubQuestion {
  final String id;
  final String label;
  final int number;
  final String text;
  final int marks;
  final String answer;
  final String? questionImage;
  final String? answerImage;

  CQSubQuestion({
    required this.id,
    required this.label,
    required this.number,
    required this.text,
    this.marks = 1,
    this.answer = '',
    this.questionImage,
    this.answerImage,
  });

  factory CQSubQuestion.fromJson(Map<String, dynamic> json) {
    return CQSubQuestion(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      number: (json['number'] as num?)?.toInt() ?? 0,
      text: json['text'] as String? ?? '',
      marks: (json['marks'] as num?)?.toInt() ?? 1,
      answer: json['answer'] as String? ?? '',
      questionImage: json['questionImage'] as String?,
      answerImage: json['answerImage'] as String?,
    );
  }
}

/// Lightweight CQ for listing pages (type=list).
class CQListItem {
  final String id;
  final String uddeepok;
  final String? uddeepokImage;
  final int questionCount;
  final bool isPremium;
  final double price;
  final String difficulty;
  final String? board;
  final String? year;
  final String chapterId;
  final String chapterName;
  final String subjectName;
  final String className;
  final String classSlug;
  final String subjectId;

  CQListItem({
    required this.id,
    required this.uddeepok,
    this.uddeepokImage,
    this.questionCount = 0,
    this.isPremium = false,
    this.price = 0,
    this.difficulty = 'medium',
    this.board,
    this.year,
    this.chapterId = '',
    this.chapterName = '',
    this.subjectName = '',
    this.className = '',
    this.classSlug = '',
    this.subjectId = '',
  });

  factory CQListItem.fromJson(Map<String, dynamic> json) {
    return CQListItem(
      id: json['id'] as String? ?? '',
      uddeepok: json['uddeepok'] as String? ?? '',
      uddeepokImage: json['uddeepokImage'] as String?,
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      difficulty: json['difficulty'] as String? ?? 'medium',
      board: json['board'] as String?,
      year: json['year'] as String?,
      chapterId: json['chapterId'] as String? ?? '',
      chapterName: json['chapterName'] as String? ?? '',
      subjectName: json['subjectName'] as String? ?? '',
      className: json['className'] as String? ?? '',
      classSlug: json['classSlug'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
    );
  }
}

/// CQ list mode response envelope.
class CQListResponse {
  final List<CQListItem> cqs;
  final int total;
  final int freeCount;
  final int premiumCount;

  CQListResponse({
    this.cqs = const [],
    this.total = 0,
    this.freeCount = 0,
    this.premiumCount = 0,
  });

  factory CQListResponse.fromJson(Map<String, dynamic> json) {
    return CQListResponse(
      cqs: (json['cqs'] as List? ?? [])
          .map((e) => CQListItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      freeCount: (json['freeCount'] as num?)?.toInt() ?? 0,
      premiumCount: (json['premiumCount'] as num?)?.toInt() ?? 0,
    );
  }
}
