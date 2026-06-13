/// Exam model.
class Exam {
  final String id;
  final String title;
  final String? description;
  final String classLevel;
  final String type;
  final int duration;
  final double totalMarks;
  final double marksPerMcq;
  final double negativeMarks;
  final String? year;
  final String? board;
  final bool isPremium;
  final double price;
  final String? instructions;
  final int totalQuestions;

  Exam({
    required this.id,
    required this.title,
    this.description,
    this.classLevel = '',
    this.type = 'mcq',
    this.duration = 0,
    this.totalMarks = 0,
    this.marksPerMcq = 1,
    this.negativeMarks = 0,
    this.year,
    this.board,
    this.isPremium = false,
    this.price = 0,
    this.instructions,
    this.totalQuestions = 0,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      classLevel: json['classLevel'] as String? ?? '',
      type: json['type'] as String? ?? 'mcq',
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 0,
      marksPerMcq: (json['marksPerMcq'] as num?)?.toDouble() ?? 1,
      negativeMarks: (json['negativeMarks'] as num?)?.toDouble() ?? 0,
      year: json['year'] as String?,
      board: json['board'] as String?,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      instructions: json['instructions'] as String?,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Exam with full questions.
class ExamDetail {
  final Exam exam;
  final List<ExamQuestion> questions;

  ExamDetail({required this.exam, this.questions = const []});

  factory ExamDetail.fromJson(Map<String, dynamic> json) {
    return ExamDetail(
      exam: Exam.fromJson(json),
      questions: (json['questions'] as List? ?? [])
          .map((e) => ExamQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Exam question.
class ExamQuestion {
  final String id;
  final String text;
  final List<MCQOption> options;
  final String correctAnswer;
  final String explanation;
  final double marks;
  final int order;

  ExamQuestion({
    required this.id,
    required this.text,
    this.options = const [],
    this.correctAnswer = '',
    this.explanation = '',
    this.marks = 1,
    this.order = 0,
  });

  factory ExamQuestion.fromJson(Map<String, dynamic> json) {
    return ExamQuestion(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      options: (json['options'] as List? ?? [])
          .map((e) => MCQOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      correctAnswer: json['correctAnswer'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      marks: (json['marks'] as num?)?.toDouble() ?? 1,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Exam result submission request.
class ExamResultRequest {
  final String examId;
  final double score;
  final double totalMarks;
  final int timeTaken;
  final Map<String, String> answers;

  ExamResultRequest({
    required this.examId,
    required this.score,
    required this.totalMarks,
    required this.timeTaken,
    required this.answers,
  });

  Map<String, dynamic> toJson() => {
        'examId': examId,
        'score': score,
        'totalMarks': totalMarks,
        'timeTaken': timeTaken,
        'answers': answers,
      };
}

/// Exam result.
class ExamResult {
  final String id;
  final String examId;
  final double score;
  final double totalMarks;
  final int timeTaken;
  final DateTime? createdAt;

  ExamResult({
    required this.id,
    required this.examId,
    this.score = 0,
    this.totalMarks = 0,
    this.timeTaken = 0,
    this.createdAt,
  });

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    return ExamResult(
      id: json['id'] as String? ?? '',
      examId: json['examId'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 0,
      timeTaken: (json['timeTaken'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

/// MCQ Exam Package.
class MCQExamPackage {
  final String id;
  final String title;
  final String? description;
  final double price;
  final double? originalPrice;
  final String? thumbnail;
  final int totalSets;
  final String status;
  final bool isPremium;
  final int order;

  MCQExamPackage({
    required this.id,
    required this.title,
    this.description,
    this.price = 0,
    this.originalPrice,
    this.thumbnail,
    this.totalSets = 0,
    this.status = 'published',
    this.isPremium = false,
    this.order = 0,
  });

  factory MCQExamPackage.fromJson(Map<String, dynamic> json) {
    return MCQExamPackage(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      thumbnail: json['thumbnail'] as String?,
      totalSets: (json['totalSets'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'published',
      isPremium: json['isPremium'] as bool? ?? false,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

/// CQ Exam Package.
class CQExamPackage {
  final String id;
  final String title;
  final String? description;
  final double price;
  final double? originalPrice;
  final String? thumbnail;
  final int totalSets;
  final String status;
  final bool isPremium;
  final int order;

  CQExamPackage({
    required this.id,
    required this.title,
    this.description,
    this.price = 0,
    this.originalPrice,
    this.thumbnail,
    this.totalSets = 0,
    this.status = 'published',
    this.isPremium = false,
    this.order = 0,
  });

  factory CQExamPackage.fromJson(Map<String, dynamic> json) {
    return CQExamPackage(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      thumbnail: json['thumbnail'] as String?,
      totalSets: (json['totalSets'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'published',
      isPremium: json['isPremium'] as bool? ?? false,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}
