import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:cookie_jar/cookie_jar.dart';

import 'exceptions.dart';
import 'models/models.dart';

/// HTTP client for the শিক্ষা বাংলা API.
///
/// Features:
/// - Cookie-based session management
/// - Automatic CSRF token fetching and injection
/// - Rate-limit aware error handling
/// - Request/response logging option
/// - Configurable timeouts
class SikkhaApiClient {
  final String baseUrl;
  final http.Client _httpClient;
  final CookieJar _cookieJar;
  final Duration _timeout;

  String? _csrfToken;

  /// Creates a new API client.
  ///
  /// [baseUrl] is the base URL of the API (e.g. `https://sikkhabangla.com`).
  /// [timeout] defaults to 30 seconds.
  SikkhaApiClient({
    required this.baseUrl,
    Duration? timeout,
    http.Client? httpClient,
    CookieJar? cookieJar,
  })  : _httpClient = httpClient ?? http.Client(),
        _cookieJar = cookieJar ?? CookieJar(),
        _timeout = timeout ?? const Duration(seconds: 30);

  /// The CSRF token for mutation requests. Automatically fetched if not set.
  String? get csrfToken => _csrfToken;

  // ──────────────────────────────────────────────────────────────
  // Public HTTP methods
  // ──────────────────────────────────────────────────────────────

  /// Send a GET request.
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, String?>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    return _request<T>(
      'GET',
      path,
      queryParams: queryParams,
      fromJson: fromJson,
    );
  }

  /// Send a POST request.
  Future<ApiResponse<T>> post<T>(
    String path, {
    Map<String, dynamic>? body,
    bool requiresCsrf = true,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    return _request<T>(
      'POST',
      path,
      body: body,
      requiresCsrf: requiresCsrf,
      fromJson: fromJson,
    );
  }

  /// Send a PUT request.
  Future<ApiResponse<T>> put<T>(
    String path, {
    Map<String, dynamic>? body,
    bool requiresCsrf = true,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    return _request<T>(
      'PUT',
      path,
      body: body,
      requiresCsrf: requiresCsrf,
      fromJson: fromJson,
    );
  }

  /// Send a PATCH request.
  Future<ApiResponse<T>> patch<T>(
    String path, {
    Map<String, dynamic>? body,
    bool requiresCsrf = true,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    return _request<T>(
      'PATCH',
      path,
      body: body,
      requiresCsrf: requiresCsrf,
      fromJson: fromJson,
    );
  }

  /// Send a DELETE request.
  Future<ApiResponse<T>> delete<T>(
    String path, {
    Map<String, String?>? queryParams,
    bool requiresCsrf = true,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    return _request<T>(
      'DELETE',
      path,
      queryParams: queryParams,
      requiresCsrf: requiresCsrf,
      fromJson: fromJson,
    );
  }

  /// Fetch a fresh CSRF token from the server.
  Future<String> fetchCsrfToken() async {
    final uri = Uri.parse('$baseUrl/api/csrf-token');
    final response = await _httpClient.get(uri).timeout(_timeout);

    if (response.statusCode != 200) {
      throw ApiException(
        message: 'CSRF টোকেন আনতে ব্যর্থ',
        statusCode: response.statusCode,
      );
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    _csrfToken = json['token'] as String?;

    // Extract CSRF cookie from response headers
    _saveCookies(uri, response);

    return _csrfToken ?? '';
  }

  /// Manually set the CSRF token (e.g., from a previously saved session).
  void setCsrfToken(String token) {
    _csrfToken = token;
  }

  /// Dispose the HTTP client.
  void dispose() {
    _httpClient.close();
  }

  // ──────────────────────────────────────────────────────────────
  // Internal request method
  // ──────────────────────────────────────────────────────────────

  Future<ApiResponse<T>> _request<T>(
    String method,
    String path, {
    Map<String, String?>? queryParams,
    Map<String, dynamic>? body,
    bool requiresCsrf = false,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final uri = _buildUri(path, queryParams);

    // Build headers
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add cookies from the cookie jar
    final cookies = await _cookieJar.loadForRequest(uri);
    if (cookies.isNotEmpty) {
      headers['Cookie'] = cookies.map((c) => '${c.name}=${c.value}').join('; ');
    }

    // Add CSRF token for mutations
    if (requiresCsrf && (method == 'POST' || method == 'PUT' || method == 'PATCH' || method == 'DELETE')) {
      if (_csrfToken == null) {
        await fetchCsrfToken();
      }
      if (_csrfToken != null) {
        headers['x-csrf-token'] = _csrfToken!;
      }
    }

    // Build request
    http.BaseRequest request;
    final uriWithQuery = uri.replace(queryParameters: _cleanParams(queryParams));

    switch (method) {
      case 'GET':
        request = http.Request(method, uriWithQuery);
        break;
      case 'POST':
      case 'PUT':
      case 'PATCH':
        request = http.Request(method, uriWithQuery);
        if (body != null) {
          request.body = jsonEncode(body);
        }
        break;
      case 'DELETE':
        request = http.Request(method, uriWithQuery);
        break;
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }

    request.headers.addAll(headers);

    try {
      final streamedResponse = await _httpClient.send(request).timeout(_timeout);
      final response = await http.Response.fromStream(streamedResponse);

      // Save cookies from response
      if (response.headers['set-cookie'] != null) {
        _saveCookies(uriWithQuery, response);
      }

      // Parse response body
      return _parseResponse<T>(response, fromJson: fromJson);
    } on SocketException {
      throw NetworkException();
    } on http.ClientException catch (e) {
      throw NetworkException(message: e.message);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // URI helpers
  // ──────────────────────────────────────────────────────────────

  Uri _buildUri(String path, Map<String, String?>? queryParams) {
    // Normalize path — add leading slash if needed
    final normalizedPath = path.startsWith('/') ? path : '/api/$path';
    return Uri.parse('$baseUrl$normalizedPath');
  }

  Map<String, String> _cleanParams(Map<String, String?>? params) {
    if (params == null) return {};
    return Map<String, String?>.from(params)
      ..removeWhere((_, v) => v == null || v.isEmpty)
      .cast<String, String>();
  }

  // ──────────────────────────────────────────────────────────────
  // Cookie management
  // ──────────────────────────────────────────────────────────────

  void _saveCookies(Uri uri, http.BaseResponse response) {
    final setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader == null) return;

    final cookies = <Cookie>[];
    for (final part in setCookieHeader.split(',')) {
      final trimmed = part.trim();
      final eqIndex = trimmed.indexOf('=');
      if (eqIndex < 0) continue;

      final semicolonIndex = trimmed.indexOf(';');
      final nameValue = semicolonIndex < 0
          ? trimmed
          : trimmed.substring(0, semicolonIndex);
      final name = nameValue.substring(0, eqIndex).trim();
      final value = nameValue.substring(eqIndex + 1).trim();

      if (name.isNotEmpty) {
        final cookie = Cookie(name, value);

        // Parse attributes
        if (semicolonIndex >= 0) {
          final attrs = trimmed.substring(semicolonIndex + 1);
          for (final attr in attrs.split(';')) {
            final a = attr.trim().toLowerCase();
            if (a == 'httponly') cookie.httpOnly = true;
            if (a == 'secure') cookie.secure = true;
          }
        }

        cookies.add(cookie);
      }
    }

    if (cookies.isNotEmpty) {
      _cookieJar.saveFromResponse(uri, cookies);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Response parsing
  // ──────────────────────────────────────────────────────────────

  ApiResponse<T> _parseResponse<T>(
    http.Response response, {
    T Function(Map<String, dynamic>)? fromJson,
  }) {
    final statusCode = response.statusCode;

    // Parse JSON body
    Map<String, dynamic>? json;
    try {
      final body = response.body;
      if (body.isNotEmpty) {
        final decoded = jsonDecode(body);
        if (decoded is Map<String, dynamic>) {
          json = decoded;
        } else if (decoded is List) {
          // Handle array responses
          json = {'data': decoded};
        }
      }
    } catch (_) {
      throw InvalidResponseException();
    }

    // Handle error responses
    if (statusCode >= 400) {
      throw parseApiError(json ?? {}, statusCode);
    }

    // Handle success response with envelope
    final success = json?['success'] as bool? ?? true;
    final rawData = json?['data'];
    final pagination = json?['pagination'];

    if (rawData == null && json != null && success) {
      // No 'data' key — the entire response is the data
      if (fromJson != null) {
        return ApiResponse<T>(
          success: true,
          data: fromJson(json),
          pagination: pagination != null ? Pagination.fromJson(pagination) : null,
        );
      }
      return ApiResponse<T>(
        success: true,
        data: json as T,
        pagination: pagination != null ? Pagination.fromJson(pagination) : null,
      );
    }

    // Parse typed data
    T? typedData;
    if (rawData != null && fromJson != null) {
      if (rawData is Map<String, dynamic>) {
        typedData = fromJson(rawData);
      }
    }

    return ApiResponse<T>(
      success: success,
      data: typedData ?? rawData as T?,
      message: json?['message'] as String?,
      pagination: pagination != null ? Pagination.fromJson(pagination) : null,
    );
  }
}
