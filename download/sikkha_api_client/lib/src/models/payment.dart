/// Payment record.
class Payment {
  final String id;
  final String userId;
  final double amount;
  final String method;
  final String? transactionId;
  final String? paymentNumber;
  final String? screenshot;
  final String contentType;
  final String? contentId;
  final String? contentTitle;
  final String? classLevel;
  final String status;
  final bool isActive;
  final String? adminNote;
  final String? reviewedBy;
  final DateTime? reviewedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? idempotencyKey;
  final PaymentUser? user;

  Payment({
    required this.id,
    required this.userId,
    this.amount = 0,
    this.method = 'bkash',
    this.transactionId,
    this.paymentNumber,
    this.screenshot,
    this.contentType = '',
    this.contentId,
    this.contentTitle,
    this.classLevel,
    this.status = 'pending',
    this.isActive = true,
    this.adminNote,
    this.reviewedBy,
    this.reviewedAt,
    this.createdAt,
    this.updatedAt,
    this.idempotencyKey,
    this.user,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      method: json['method'] as String? ?? 'bkash',
      transactionId: json['transactionId'] as String?,
      paymentNumber: json['paymentNumber'] as String?,
      screenshot: json['screenshot'] as String?,
      contentType: json['contentType'] as String? ?? '',
      contentId: json['contentId'] as String?,
      contentTitle: json['contentTitle'] as String?,
      classLevel: json['classLevel'] as String?,
      status: json['status'] as String? ?? 'pending',
      isActive: json['isActive'] as bool? ?? true,
      adminNote: json['adminNote'] as String?,
      reviewedBy: json['reviewedBy'] as String?,
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.tryParse(json['reviewedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
      idempotencyKey: json['idempotencyKey'] as String?,
      user: json['user'] != null
          ? PaymentUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PaymentUser {
  final String id;
  final String name;
  final String email;
  final String? phone;

  PaymentUser({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  factory PaymentUser.fromJson(Map<String, dynamic> json) {
    return PaymentUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
    );
  }
}

/// Payment creation request.
class PaymentRequest {
  final double amount;
  final String method;
  final String transactionId;
  final String paymentNumber;
  final String? screenshot;
  final String contentType;
  final String contentId;
  final String? contentTitle;
  final String? classLevel;
  final String? idempotencyKey;

  PaymentRequest({
    required this.amount,
    required this.method,
    required this.transactionId,
    required this.paymentNumber,
    this.screenshot,
    required this.contentType,
    required this.contentId,
    this.contentTitle,
    this.classLevel,
    this.idempotencyKey,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'method': method,
        'transactionId': transactionId,
        'paymentNumber': paymentNumber,
        if (screenshot != null) 'screenshot': screenshot,
        'contentType': contentType,
        'contentId': contentId,
        if (contentTitle != null) 'contentTitle': contentTitle,
        if (classLevel != null) 'classLevel': classLevel,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
      };
}

/// Access check result.
class AccessCheckResult {
  final bool purchased;
  final String? reason;
  final bool pendingPayment;
  final SubscriptionInfo? subscription;
  final String? bundleTitle;

  AccessCheckResult({
    this.purchased = false,
    this.reason,
    this.pendingPayment = false,
    this.subscription,
    this.bundleTitle,
  });

  factory AccessCheckResult.fromJson(Map<String, dynamic> json) {
    return AccessCheckResult(
      purchased: json['purchased'] as bool? ?? false,
      reason: json['reason'] as String?,
      pendingPayment: json['pendingPayment'] as bool? ?? false,
      subscription: json['subscription'] != null
          ? SubscriptionInfo.fromJson(json['subscription'] as Map<String, dynamic>)
          : null,
      bundleTitle: json['bundleTitle'] as String?,
    );
  }
}

class SubscriptionInfo {
  final String id;
  final String packageName;
  final String durationLabel;
  final DateTime? endDate;

  SubscriptionInfo({
    required this.id,
    required this.packageName,
    required this.durationLabel,
    this.endDate,
  });

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) {
    return SubscriptionInfo(
      id: json['id'] as String? ?? '',
      packageName: json['packageName'] as String? ?? '',
      durationLabel: json['durationLabel'] as String? ?? '',
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
    );
  }
}

/// Batch access check.
class BatchAccessCheckRequest {
  final List<ContentIdentifier> items;

  BatchAccessCheckRequest({required this.items});

  Map<String, dynamic> toJson() => {
        'items': items.map((e) => e.toJson()).toList(),
      };
}

class ContentIdentifier {
  final String contentType;
  final String contentId;

  ContentIdentifier({required this.contentType, required this.contentId});

  Map<String, dynamic> toJson() => {
        'contentType': contentType,
        'contentId': contentId,
      };

  factory ContentIdentifier.fromJson(Map<String, dynamic> json) {
    return ContentIdentifier(
      contentType: json['contentType'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
    );
  }
}

class BatchAccessCheckItem {
  final String contentType;
  final String contentId;
  final bool purchased;
  final bool pendingPayment;

  BatchAccessCheckItem({
    required this.contentType,
    required this.contentId,
    this.purchased = false,
    this.pendingPayment = false,
  });

  factory BatchAccessCheckItem.fromJson(Map<String, dynamic> json) {
    return BatchAccessCheckItem(
      contentType: json['contentType'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      purchased: json['purchased'] as bool? ?? false,
      pendingPayment: json['pendingPayment'] as bool? ?? false,
    );
  }
}

/// Content info (for payment dialog).
class ContentInfo {
  final String title;
  final double price;
  final bool isPremium;
  final String contentType;
  final String contentId;
  final String contentTypeLabel;
  final String? description;
  final double? originalPrice;
  final int? duration;
  final String? durationLabel;
  final String? classLevel;
  final int? mcqCount;
  final int? cqCount;
  final int? lectureCount;
  final int? totalContent;
  final int? itemCount;
  final List<BundleItem>? items;

  ContentInfo({
    required this.title,
    this.price = 0,
    this.isPremium = false,
    this.contentType = '',
    this.contentId = '',
    this.contentTypeLabel = '',
    this.description,
    this.originalPrice,
    this.duration,
    this.durationLabel,
    this.classLevel,
    this.mcqCount,
    this.cqCount,
    this.lectureCount,
    this.totalContent,
    this.itemCount,
    this.items,
  });

  factory ContentInfo.fromJson(Map<String, dynamic> json) {
    return ContentInfo(
      title: json['title'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      isPremium: json['isPremium'] as bool? ?? false,
      contentType: json['contentType'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      contentTypeLabel: json['contentTypeLabel'] as String? ?? '',
      description: json['description'] as String?,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      duration: (json['duration'] as num?)?.toInt(),
      durationLabel: json['durationLabel'] as String?,
      classLevel: json['classLevel'] as String?,
      mcqCount: (json['mcqCount'] as num?)?.toInt(),
      cqCount: (json['cqCount'] as num?)?.toInt(),
      lectureCount: (json['lectureCount'] as num?)?.toInt(),
      totalContent: (json['totalContent'] as num?)?.toInt(),
      itemCount: (json['itemCount'] as num?)?.toInt(),
      items: (json['items'] as List? ?? [])
          .map((e) => BundleItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class BundleItem {
  final String id;
  final String contentType;
  final String contentId;
  final int order;

  BundleItem({
    required this.id,
    required this.contentType,
    required this.contentId,
    this.order = 0,
  });

  factory BundleItem.fromJson(Map<String, dynamic> json) {
    return BundleItem(
      id: json['id'] as String? ?? '',
      contentType: json['contentType'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Payment accounts.
class PaymentAccounts {
  final String bkash;
  final String nagad;
  final String rocket;

  PaymentAccounts({
    this.bkash = '017XXXXXXXX',
    this.nagad = '018XXXXXXXX',
    this.rocket = '016XXXXXXXX',
  });

  factory PaymentAccounts.fromJson(Map<String, dynamic> json) {
    return PaymentAccounts(
      bkash: json['bkash'] as String? ?? '017XXXXXXXX',
      nagad: json['nagad'] as String? ?? '018XXXXXXXX',
      rocket: json['rocket'] as String? ?? '016XXXXXXXX',
    );
  }
}
