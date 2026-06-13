/// Base exception for all API errors.
class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? code;
  final Map<String, dynamic>? details;

  ApiException({
    required this.message,
    required this.statusCode,
    this.code,
    this.details,
  });

  @override
  String toString() => 'ApiException($statusCode): $message${code != null ? ' [$code]' : ''}';
}

/// Thrown when authentication fails (401).
class UnauthorizedException extends ApiException {
  UnauthorizedException({String? message, String? code})
      : super(
          message: message ?? 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।',
          statusCode: 401,
          code: code,
        );
}

/// Thrown when the user lacks permissions (403).
class ForbiddenException extends ApiException {
  ForbiddenException({String? message, String? code})
      : super(
          message: message ?? 'এই অপারেশনের অনুমতি নেই',
          statusCode: 403,
          code: code,
        );
}

/// Thrown when a resource is not found (404).
class NotFoundException extends ApiException {
  NotFoundException({String? message, String? code})
      : super(
          message: message ?? 'রিসোর্স খুঁজে পাওয়া যায়নি',
          statusCode: 404,
          code: code,
        );
}

/// Thrown when rate limit is exceeded (429).
class RateLimitExceededException extends ApiException {
  final int? retryAfterSeconds;

  RateLimitExceededException({String? message, this.retryAfterSeconds})
      : super(
          message: message ?? 'অনেক বেশি অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          statusCode: 429,
          code: 'RATE_LIMIT_EXCEEDED',
        );
}

/// Thrown on validation errors (400, 422).
class ValidationException extends ApiException {
  final List<ValidationError> errors;

  ValidationException({
    String? message,
    int statusCode = 400,
    String? code,
    this.errors = const [],
    Map<String, dynamic>? details,
  }) : super(
          message: message ?? 'ইনপুট ভ্যালিডেশন ব্যর্থ',
          statusCode: statusCode,
          code: code,
          details: details,
        );
}

/// A single validation error for a specific field.
class ValidationError {
  final String field;
  final String message;

  ValidationError({required this.field, required this.message});

  factory ValidationError.fromJson(Map<String, dynamic> json) {
    return ValidationError(
      field: json['field'] as String? ?? '',
      message: json['message'] as String? ?? '',
    );
  }
}

/// Thrown when a duplicate entry is detected (409).
class ConflictException extends ApiException {
  ConflictException({String? message, String? code})
      : super(
          message: message ?? 'এই রিসোর্স ইতিমধ্যে বিদ্যমান',
          statusCode: 409,
          code: code ?? 'CONFLICT',
        );
}

/// Thrown when CSRF token is missing or invalid.
class CsrfException extends ApiException {
  CsrfException({String? message})
      : super(
          message: message ?? 'CSRF টোকেন বৈধ নয়। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।',
          statusCode: 403,
          code: 'CSRF_TOKEN_INVALID',
        );
}

/// Thrown when there is a network connectivity issue.
class NetworkException extends ApiException {
  NetworkException({String? message})
      : super(
          message: message ?? 'নেটওয়ার্ক সংযোগ ব্যর্থ। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।',
          statusCode: 0,
          code: 'NETWORK_ERROR',
        );
}

/// Thrown when the server returns an unexpected format (e.g., non-JSON).
class InvalidResponseException extends ApiException {
  InvalidResponseException({String? message})
      : super(
          message: message ?? 'সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া',
          statusCode: -1,
          code: 'INVALID_RESPONSE',
        );
}

/// Creates the appropriate [ApiException] from an HTTP response map.
ApiException parseApiError(Map<String, dynamic> json, int statusCode) {
  final error = json['error'] as String? ?? 'অজানা ত্রুটি';
  final code = json['code'] as String?;
  final details = json['details'];

  List<ValidationError> validationErrors = [];
  if (details is List) {
    validationErrors = details
        .map((d) => ValidationError.fromJson(d as Map<String, dynamic>))
        .toList();
  }

  switch (statusCode) {
    case 400:
    case 422:
      return ValidationException(
        message: error,
        statusCode: statusCode,
        code: code,
        errors: validationErrors,
        details: details as Map<String, dynamic>?,
      );
    case 401:
      return UnauthorizedException(message: error, code: code);
    case 403:
      if (code == 'CSRF_TOKEN_INVALID') {
        return CsrfException(message: error);
      }
      return ForbiddenException(message: error, code: code);
    case 404:
      return NotFoundException(message: error, code: code);
    case 409:
      return ConflictException(message: error, code: code);
    case 429:
      return RateLimitExceededException(message: error);
    default:
      return ApiException(
        message: error,
        statusCode: statusCode,
        code: code,
        details: details as Map<String, dynamic>?,
      );
  }
}
