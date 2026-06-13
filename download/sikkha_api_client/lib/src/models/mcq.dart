/// MCQ (Multiple Choice Question) model.
class MCQ {
  final String id;
  final String text;
  final String? questionImage;
  final List<MCQOption> options;
  final String correctAnswer;
  final String explanation;
  final String? explanationImage;
  final bool isPremium;
  final double price;
  final String classLevel;
  final String subjectId;
  final String chapterId;
  final String chapterName;
  final String difficulty;
  final String? board;
  final String? year;
  final bool hasAccess;

  MCQ({
    required this.id,
    required this.text,
    this.questionImage,
    this.options = const [],
    this.correctAnswer = '',
    this.explanation = '',
    this.explanationImage,
    this.isPremium = false,
    this.price = 0,
    this.classLevel = '',
    this.subjectId = '',
    this.chapterId = '',
    this.chapterName = '',
    this.difficulty = 'medium',
    this.board,
    this.year,
    this.hasAccess = true,
  });

  factory MCQ.fromJson(Map<String, dynamic> json) {
    return MCQ(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      questionImage: json['questionImage'] as String?,
      options: (json['options'] as List? ?? [])
          .map((e) => MCQOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      correctAnswer: json['correctAnswer'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      explanationImage: json['explanationImage'] as String?,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      classLevel: json['classLevel'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      chapterName: json['chapterName'] as String? ?? '',
      difficulty: json['difficulty'] as String? ?? 'medium',
      board: json['board'] as String?,
      year: json['year'] as String?,
      hasAccess: json['hasAccess'] as bool? ?? true,
    );
  }
}

/// MCQ option.
class MCQOption {
  final String key;
  final String text;
  final String? image;

  MCQOption({required this.key, required this.text, this.image});

  factory MCQOption.fromJson(Map<String, dynamic> json) {
    return MCQOption(
      key: json['key'] as String? ?? '',
      text: json['text'] as String? ?? '',
      image: json['image'] as String?,
    );
  }
}

/// Lightweight MCQ for listing pages (type=list).
class MCQListItem {
  final String id;
  final String text;
  final String? questionImage;
  final bool isPremium;
  final double price;
  final String classLevel;
  final String subjectId;
  final String chapterId;
  final String chapterName;
  final String difficulty;
  final String? board;
  final String? year;

  MCQListItem({
    required this.id,
    required this.text,
    this.questionImage,
    this.isPremium = false,
    this.price = 0,
    this.classLevel = '',
    this.subjectId = '',
    this.chapterId = '',
    this.chapterName = '',
    this.difficulty = 'medium',
    this.board,
    this.year,
  });

  factory MCQListItem.fromJson(Map<String, dynamic> json) {
    return MCQListItem(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      questionImage: json['questionImage'] as String?,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      classLevel: json['classLevel'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      chapterName: json['chapterName'] as String? ?? '',
      difficulty: json['difficulty'] as String? ?? 'medium',
      board: json['board'] as String?,
      year: json['year'] as String?,
    );
  }
}

/// MCQ list mode response envelope.
class MCQListResponse {
  final List<MCQListItem> questions;
  final int total;
  final int freeCount;
  final int premiumCount;
  final int boardCount;
  final int practiceCount;

  MCQListResponse({
    this.questions = const [],
    this.total = 0,
    this.freeCount = 0,
    this.premiumCount = 0,
    this.boardCount = 0,
    this.practiceCount = 0,
  });

  factory MCQListResponse.fromJson(Map<String, dynamic> json) {
    return MCQListResponse(
      questions: (json['questions'] as List? ?? [])
          .map((e) => MCQListItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      freeCount: (json['freeCount'] as num?)?.toInt() ?? 0,
      premiumCount: (json['premiumCount'] as num?)?.toInt() ?? 0,
      boardCount: (json['boardCount'] as num?)?.toInt() ?? 0,
      practiceCount: (json['practiceCount'] as num?)?.toInt() ?? 0,
    );
  }
}

/// MCQ exam mode response.
class MCQExamResponse {
  final List<MCQ> questions;
  final int total;
  final String mode;

  MCQExamResponse({
    this.questions = const [],
    this.total = 0,
    this.mode = 'exam',
  });

  factory MCQExamResponse.fromJson(Map<String, dynamic> json) {
    return MCQExamResponse(
      questions: (json['questions'] as List? ?? [])
          .map((e) => MCQ.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      mode: json['mode'] as String? ?? 'exam',
    );
  }
}
