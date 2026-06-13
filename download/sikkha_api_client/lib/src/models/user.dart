/// User model.
class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? avatar;
  final String? phone;
  final String? institute;
  final String? classLevel;
  final String? board;
  final bool isVerified;
  final bool isPremium;
  final DateTime? premiumExpiry;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatar,
    this.phone,
    this.institute,
    this.classLevel,
    this.board,
    this.isVerified = false,
    this.isPremium = false,
    this.premiumExpiry,
    this.createdAt,
    this.updatedAt,
  });

  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isSuperAdmin => role == 'SUPER_ADMIN';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? '',
      role: json['role'] as String? ?? 'STUDENT',
      avatar: json['avatar'] as String?,
      phone: json['phone'] as String?,
      institute: json['institute'] as String?,
      classLevel: json['classLevel'] as String?,
      board: json['board'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      isPremium: json['isPremium'] as bool? ?? false,
      premiumExpiry: json['premiumExpiry'] != null
          ? DateTime.tryParse(json['premiumExpiry'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'avatar': avatar,
        'phone': phone,
        'institute': institute,
        'classLevel': classLevel,
        'board': board,
        'isVerified': isVerified,
        'isPremium': isPremium,
        'premiumExpiry': premiumExpiry?.toIso8601String(),
      };
}

/// Profile update request.
class ProfileUpdateRequest {
  final String? name;
  final String? phone;
  final String? institute;
  final String? classLevel;
  final String? board;
  final String? avatar;

  ProfileUpdateRequest({
    this.name,
    this.phone,
    this.institute,
    this.classLevel,
    this.board,
    this.avatar,
  });

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (institute != null) 'institute': institute,
        if (classLevel != null) 'classLevel': classLevel,
        if (board != null) 'board': board,
        if (avatar != null) 'avatar': avatar,
      };
}

/// Dashboard data.
class DashboardData {
  final DashboardStats stats;
  final List<RecentLecture> recentLectures;
  final List<RecentExam> recentExams;
  final List<BookmarkedQuestion> bookmarkedQuestions;
  final List<PaymentHistoryItem> paymentHistory;

  DashboardData({
    required this.stats,
    this.recentLectures = const [],
    this.recentExams = const [],
    this.bookmarkedQuestions = const [],
    this.paymentHistory = const [],
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      stats: DashboardStats.fromJson(json['stats'] as Map<String, dynamic>? ?? {}),
      recentLectures: (json['recentLectures'] as List? ?? [])
          .map((e) => RecentLecture.fromJson(e as Map<String, dynamic>))
          .toList(),
      recentExams: (json['recentExams'] as List? ?? [])
          .map((e) => RecentExam.fromJson(e as Map<String, dynamic>))
          .toList(),
      bookmarkedQuestions: (json['bookmarkedQuestions'] as List? ?? [])
          .map((e) => BookmarkedQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
      paymentHistory: (json['paymentHistory'] as List? ?? [])
          .map((e) => PaymentHistoryItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class DashboardStats {
  final int completedLectures;
  final int totalLectures;
  final double avgMcqScore;
  final int savedQuestions;
  final bool isPremium;
  final DateTime? premiumExpiry;

  DashboardStats({
    this.completedLectures = 0,
    this.totalLectures = 0,
    this.avgMcqScore = 0,
    this.savedQuestions = 0,
    this.isPremium = false,
    this.premiumExpiry,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      completedLectures: (json['completedLectures'] as num?)?.toInt() ?? 0,
      totalLectures: (json['totalLectures'] as num?)?.toInt() ?? 0,
      avgMcqScore: (json['avgMcqScore'] as num?)?.toDouble() ?? 0,
      savedQuestions: (json['savedQuestions'] as num?)?.toInt() ?? 0,
      isPremium: json['isPremium'] as bool? ?? false,
      premiumExpiry: json['premiumExpiry'] != null
          ? DateTime.tryParse(json['premiumExpiry'] as String)
          : null,
    );
  }
}

class RecentLecture {
  final String id;
  final String title;
  final String subject;
  final double progress;

  RecentLecture({
    required this.id,
    required this.title,
    required this.subject,
    this.progress = 0,
  });

  factory RecentLecture.fromJson(Map<String, dynamic> json) {
    return RecentLecture(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
    );
  }
}

class RecentExam {
  final String id;
  final String subject;
  final double score;
  final double total;
  final String date;

  RecentExam({
    required this.id,
    required this.subject,
    this.score = 0,
    this.total = 0,
    this.date = '',
  });

  factory RecentExam.fromJson(Map<String, dynamic> json) {
    return RecentExam(
      id: json['id'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      date: json['date'] as String? ?? '',
    );
  }
}

class BookmarkedQuestion {
  final String id;
  final String text;
  final String type;

  BookmarkedQuestion({
    required this.id,
    required this.text,
    required this.type,
  });

  factory BookmarkedQuestion.fromJson(Map<String, dynamic> json) {
    return BookmarkedQuestion(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      type: json['type'] as String? ?? '',
    );
  }
}

class PaymentHistoryItem {
  final String id;
  final String planName;
  final double amount;
  final String date;
  final String status;

  PaymentHistoryItem({
    required this.id,
    required this.planName,
    this.amount = 0,
    this.date = '',
    this.status = 'pending',
  });

  factory PaymentHistoryItem.fromJson(Map<String, dynamic> json) {
    return PaymentHistoryItem(
      id: json['id'] as String? ?? '',
      planName: json['planName'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      date: json['date'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
    );
  }
}

/// Recent lecture (from /api/user/recent-lectures).
class RecentLectureItem {
  final String id;
  final String title;
  final String subject;
  final String chapter;
  final double progress;
  final DateTime? viewedAt;

  RecentLectureItem({
    required this.id,
    required this.title,
    required this.subject,
    required this.chapter,
    this.progress = 0,
    this.viewedAt,
  });

  factory RecentLectureItem.fromJson(Map<String, dynamic> json) {
    return RecentLectureItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      chapter: json['chapter'] as String? ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      viewedAt: json['viewedAt'] != null
          ? DateTime.tryParse(json['viewedAt'] as String)
          : null,
    );
  }
}

/// Subscription data.
class SubscriptionData {
  final String id;
  final String? packageId;
  final String packageName;
  final String? packageThumbnail;
  final String durationLabel;
  final String? classLevel;
  final String? classLabel;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isActive;
  final bool isExpired;
  final int daysRemaining;
  final String? paymentId;

  SubscriptionData({
    required this.id,
    this.packageId,
    required this.packageName,
    this.packageThumbnail,
    required this.durationLabel,
    this.classLevel,
    this.classLabel,
    this.startDate,
    this.endDate,
    this.isActive = false,
    this.isExpired = false,
    this.daysRemaining = 0,
    this.paymentId,
  });

  factory SubscriptionData.fromJson(Map<String, dynamic> json) {
    return SubscriptionData(
      id: json['id'] as String? ?? '',
      packageId: json['packageId'] as String?,
      packageName: json['packageName'] as String? ?? '',
      packageThumbnail: json['packageThumbnail'] as String?,
      durationLabel: json['durationLabel'] as String? ?? '',
      classLevel: json['classLevel'] as String?,
      classLabel: json['classLabel'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      isActive: json['isActive'] as bool? ?? false,
      isExpired: json['isExpired'] as bool? ?? false,
      daysRemaining: (json['daysRemaining'] as num?)?.toInt() ?? 0,
      paymentId: json['paymentId'] as String?,
    );
  }
}

/// Feedback/support ticket.
class FeedbackItem {
  final String id;
  final String subject;
  final String status;
  final DateTime? updatedAt;
  final List<FeedbackMessage> messages;
  final int messageCount;

  FeedbackItem({
    required this.id,
    required this.subject,
    this.status = 'pending',
    this.updatedAt,
    this.messages = const [],
    this.messageCount = 0,
  });

  factory FeedbackItem.fromJson(Map<String, dynamic> json) {
    return FeedbackItem(
      id: json['id'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
      messages: (json['messages'] as List? ?? [])
          .map((e) => FeedbackMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
      messageCount: (json['_count'] is Map
              ? (json['_count'] as Map)['messages'] as int?
              : null) ??
          (json['messages'] as List?)?.length ?? 0,
    );
  }
}

class FeedbackMessage {
  final String senderId;
  final String senderRole;
  final String message;
  final DateTime? createdAt;

  FeedbackMessage({
    required this.senderId,
    required this.senderRole,
    required this.message,
    this.createdAt,
  });

  factory FeedbackMessage.fromJson(Map<String, dynamic> json) {
    return FeedbackMessage(
      senderId: json['senderId'] as String? ?? '',
      senderRole: json['senderRole'] as String? ?? '',
      message: json['message'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
