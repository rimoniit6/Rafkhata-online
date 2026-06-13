/// Data models for the শিক্ষা বাংলা API.
library models;

export 'admin.dart';
export 'auth.dart';
export 'content.dart';
export 'cq.dart';
export 'exam.dart';
export 'lecture.dart';
export 'mcq.dart';
export 'payment.dart';
export 'progress.dart';
export 'suggestion.dart';
export 'user.dart';

/// Standard API response envelope.
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final Pagination? pagination;
  final String? error;
  final String? code;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.pagination,
    this.error,
    this.code,
  });

  bool get isSuccess => success;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json, {
    T Function(Map<String, dynamic>)? fromData,
  }) {
    final rawData = json['data'];
    final pagination = json['pagination'];

    T? parsedData;
    if (rawData != null && fromData != null) {
      if (rawData is Map<String, dynamic>) {
        parsedData = fromData(rawData);
      }
    }

    return ApiResponse(
      success: json['success'] as bool? ?? true,
      data: parsedData ?? rawData as T?,
      message: json['message'] as String?,
      error: json['error'] as String?,
      code: json['code'] as String?,
      pagination: pagination != null
          ? Pagination.fromJson(pagination as Map<String, dynamic>)
          : null,
    );
  }
}

/// Pagination metadata.
class Pagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      page: (json['page'] as num?)?.toInt() ?? 1,
      limit: (json['limit'] as num?)?.toInt() ?? 20,
      total: (json['total'] as num?)?.toInt() ?? 0,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'page': page,
        'limit': limit,
        'total': total,
        'totalPages': totalPages,
      };
}
