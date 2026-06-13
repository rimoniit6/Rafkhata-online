/// Admin dashboard statistics.
class AdminStats {
  final UserStats users;
  final ContentStats content;
  final PaymentStats payments;
  final List<Payment>? recentPayments;
  final Map<String, double>? monthlyRevenue;

  AdminStats({
    required this.users,
    required this.content,
    required this.payments,
    this.recentPayments,
    this.monthlyRevenue,
  });

  factory AdminStats.fromJson(Map<String, dynamic> json) {
    return AdminStats(
      users: UserStats.fromJson(json['users'] as Map<String, dynamic>? ?? {}),
      content: ContentStats.fromJson(json['content'] as Map<String, dynamic>? ?? {}),
      payments: PaymentStats.fromJson(json['payments'] as Map<String, dynamic>? ?? {}),
      recentPayments: (json['recentPayments'] as List? ?? [])
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList(),
      monthlyRevenue: (json['monthlyRevenue'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, (v as num).toDouble())),
    );
  }
}

class UserStats {
  final int total;
  final int students;
  final int premium;
  final int today;

  UserStats({
    this.total = 0,
    this.students = 0,
    this.premium = 0,
    this.today = 0,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      students: (json['students'] as num?)?.toInt() ?? 0,
      premium: (json['premium'] as num?)?.toInt() ?? 0,
      today: (json['today'] as num?)?.toInt() ?? 0,
    );
  }
}

class ContentStats {
  final int mcqs;
  final int cqs;
  final int lectures;
  final int classes;
  final int subjects;
  final int chapters;

  ContentStats({
    this.mcqs = 0,
    this.cqs = 0,
    this.lectures = 0,
    this.classes = 0,
    this.subjects = 0,
    this.chapters = 0,
  });

  factory ContentStats.fromJson(Map<String, dynamic> json) {
    return ContentStats(
      mcqs: (json['mcqs'] as num?)?.toInt() ?? 0,
      cqs: (json['cqs'] as num?)?.toInt() ?? 0,
      lectures: (json['lectures'] as num?)?.toInt() ?? 0,
      classes: (json['classes'] as num?)?.toInt() ?? 0,
      subjects: (json['subjects'] as num?)?.toInt() ?? 0,
      chapters: (json['chapters'] as num?)?.toInt() ?? 0,
    );
  }
}

class PaymentStats {
  final int total;
  final int pending;
  final int approved;
  final double totalRevenue;

  PaymentStats({
    this.total = 0,
    this.pending = 0,
    this.approved = 0,
    this.totalRevenue = 0,
  });

  factory PaymentStats.fromJson(Map<String, dynamic> json) {
    return PaymentStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      pending: (json['pending'] as num?)?.toInt() ?? 0,
      approved: (json['approved'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// User update request (admin).
class AdminUserUpdateRequest {
  final String? id;
  final List<String>? ids;
  final String? name;
  final String? role;
  final String? phone;
  final String? institute;
  final String? classLevel;
  final String? board;
  final bool? isVerified;
  final bool? isPremium;
  final DateTime? premiumExpiry;

  AdminUserUpdateRequest({
    this.id,
    this.ids,
    this.name,
    this.role,
    this.phone,
    this.institute,
    this.classLevel,
    this.board,
    this.isVerified,
    this.isPremium,
    this.premiumExpiry,
  });

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (ids != null) 'ids': ids,
        if (name != null) 'name': name,
        if (role != null) 'role': role,
        if (phone != null) 'phone': phone,
        if (institute != null) 'institute': institute,
        if (classLevel != null) 'classLevel': classLevel,
        if (board != null) 'board': board,
        if (isVerified != null) 'isVerified': isVerified,
        if (isPremium != null) 'isPremium': isPremium,
        if (premiumExpiry != null) 'premiumExpiry': premiumExpiry!.toIso8601String(),
      };
}

/// Payment review request (admin).
class PaymentReviewRequest {
  final String id;
  final String status; // "approved" or "rejected"
  final String? adminNote;

  PaymentReviewRequest({
    required this.id,
    required this.status,
    this.adminNote,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status,
        if (adminNote != null) 'adminNote': adminNote,
      };
}
