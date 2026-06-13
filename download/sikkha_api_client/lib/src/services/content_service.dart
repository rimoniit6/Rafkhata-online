import '../client.dart';
import '../models/models.dart';

/// Content hierarchy API service (classes, boards, years, etc.).
class ContentService {
  final SikkhaApiClient _client;

  ContentService(this._client);

  /// Get all active class categories.
  Future<List<ClassCategory>> getClasses() async {
    final response = await _client.get<Map<String, dynamic>>('/api/classes');
    final data = response.data as Map<String, dynamic>?;
    final classes = data?['classes'] as List? ?? [];
    return classes
        .map((e) => ClassCategory.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get all active boards.
  Future<List<Board>> getBoards() async {
    final response = await _client.get<List>('/api/boards');
    final data = response.data;
    if (data is List) {
      return data.map((e) => Board.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Get all active years.
  Future<List<ExamYear>> getYears() async {
    final response = await _client.get<List>('/api/years');
    final data = response.data;
    if (data is List) {
      return data.map((e) => ExamYear.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// Get board-year combinations.
  Future<List> getBoardYears({String? board}) async {
    final queryParams = board != null ? {'board': board} : null;
    final response = await _client.get<List>(
      '/api/board-years',
      queryParams: queryParams,
    );
    return response.data is List ? response.data as List : [];
  }

  /// Get hierarchy metadata.
  Future<Map<String, dynamic>> getHierarchyMetadata() async {
    final response = await _client.get<Map<String, dynamic>>('/api/hierarchy/metadata');
    return response.data as Map<String, dynamic>? ?? {};
  }

  /// Get site configuration.
  Future<SiteConfig> getConfig() async {
    final response = await _client.get<SiteConfig>(
      '/api/config',
      fromJson: SiteConfig.fromJson,
    );
    return response.data!;
  }

  /// Get public site statistics.
  Future<PublicStats> getStats() async {
    final response = await _client.get<PublicStats>(
      '/api/stats',
      fromJson: PublicStats.fromJson,
    );
    return response.data ?? PublicStats();
  }

  /// Get active banners.
  Future<List<Banner>> getBanners() async {
    final response = await _client.get<Map<String, dynamic>>('/api/banners');
    final data = response.data as Map<String, dynamic>?;
    final banners = data?['banners'] as List? ?? [];
    return banners
        .map((e) => Banner.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get active FAQs.
  Future<List<Faq>> getFaqs() async {
    final response = await _client.get<Map<String, dynamic>>('/api/faqs');
    final data = response.data as Map<String, dynamic>?;
    final faqs = data?['faqs'] as List? ?? [];
    return faqs
        .map((e) => Faq.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get active testimonials.
  Future<List<Testimonial>> getTestimonials() async {
    final response = await _client.get<Map<String, dynamic>>('/api/testimonials');
    final data = response.data as Map<String, dynamic>?;
    final testimonials = data?['testimonials'] as List? ?? [];
    return testimonials
        .map((e) => Testimonial.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get active teachers/moderators.
  Future<List<TeacherModerator>> getTeacherModerators() async {
    final response = await _client.get<Map<String, dynamic>>('/api/teacher-moderators');
    final data = response.data as Map<String, dynamic>?;
    final teachers = data?['teachers'] as List? ?? [];
    return teachers
        .map((e) => TeacherModerator.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get navigation items.
  Future<List<NavItem>> getNavigation() async {
    final response = await _client.get<Map<String, dynamic>>('/api/navigation');
    final data = response.data as Map<String, dynamic>?;
    final items = data?['items'] as List? ?? [];
    return items
        .map((e) => NavItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get content types.
  Future<List<ContentType>> getContentTypes() async {
    final response = await _client.get<List>('/api/content-types');
    final data = response.data;
    if (data is List) {
      return data.map((e) => ContentType.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
