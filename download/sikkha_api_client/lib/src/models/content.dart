/// Class category (e.g., "ষষ্ঠ শ্রেণি", "এসএসসি").
class ClassCategory {
  final String id;
  final String name;
  final String slug;
  final int subjectCount;
  final String icon;
  final String gradient;
  final String? description;
  final String? color;
  final ContentCounts? contentCounts;
  final int totalContent;

  ClassCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.subjectCount = 0,
    this.icon = 'BookOpen',
    this.gradient = 'from-emerald-400 to-teal-600',
    this.description,
    this.color,
    this.contentCounts,
    this.totalContent = 0,
  });

  factory ClassCategory.fromJson(Map<String, dynamic> json) {
    return ClassCategory(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      subjectCount: (json['subjectCount'] as num?)?.toInt() ?? 0,
      icon: json['icon'] as String? ?? 'BookOpen',
      gradient: json['gradient'] as String? ?? 'from-emerald-400 to-teal-600',
      description: json['description'] as String?,
      color: json['color'] as String?,
      contentCounts: json['contentCounts'] != null
          ? ContentCounts.fromJson(json['contentCounts'] as Map<String, dynamic>)
          : null,
      totalContent: (json['totalContent'] as num?)?.toInt() ?? 0,
    );
  }
}

class ContentCounts {
  final int lectures;
  final int freeLectures;
  final int mcqs;
  final int freeMcqs;
  final int cqs;
  final int freeCqs;
  final int boardQuestions;
  final int freeBoardQuestions;

  ContentCounts({
    this.lectures = 0,
    this.freeLectures = 0,
    this.mcqs = 0,
    this.freeMcqs = 0,
    this.cqs = 0,
    this.freeCqs = 0,
    this.boardQuestions = 0,
    this.freeBoardQuestions = 0,
  });

  factory ContentCounts.fromJson(Map<String, dynamic> json) {
    return ContentCounts(
      lectures: (json['lectures'] as num?)?.toInt() ?? 0,
      freeLectures: (json['freeLectures'] as num?)?.toInt() ?? 0,
      mcqs: (json['mcqs'] as num?)?.toInt() ?? 0,
      freeMcqs: (json['freeMcqs'] as num?)?.toInt() ?? 0,
      cqs: (json['cqs'] as num?)?.toInt() ?? 0,
      freeCqs: (json['freeCqs'] as num?)?.toInt() ?? 0,
      boardQuestions: (json['boardQuestions'] as num?)?.toInt() ?? 0,
      freeBoardQuestions: (json['freeBoardQuestions'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Subject.
class Subject {
  final String id;
  final String name;
  final String slug;
  final String classId;
  final String? icon;
  final String? color;
  final String? description;
  final int order;
  final bool isActive;
  final ClassCategory? classCategory;
  final int chapterCount;

  Subject({
    required this.id,
    required this.name,
    required this.slug,
    required this.classId,
    this.icon,
    this.color,
    this.description,
    this.order = 0,
    this.isActive = true,
    this.classCategory,
    this.chapterCount = 0,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      classId: json['classId'] as String? ?? '',
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      description: json['description'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      classCategory: json['class'] != null
          ? ClassCategory.fromJson(json['class'] as Map<String, dynamic>)
          : null,
      chapterCount: (json['_count'] is Map
              ? (json['_count'] as Map)['chapters'] as int?
              : null) ??
          0,
    );
  }
}

/// Chapter.
class Chapter {
  final String id;
  final String name;
  final String slug;
  final String subjectId;

  Chapter({
    required this.id,
    required this.name,
    required this.slug,
    required this.subjectId,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
    );
  }
}

/// Board (e.g., "ঢাকা", "রাজশাহী").
class Board {
  final String id;
  final String name;
  final String slug;
  final String? color;

  Board({
    required this.id,
    required this.name,
    required this.slug,
    this.color,
  });

  factory Board.fromJson(Map<String, dynamic> json) {
    return Board(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      color: json['color'] as String?,
    );
  }
}

/// Exam year.
class ExamYear {
  final String id;
  final String year;

  ExamYear({required this.id, required this.year});

  factory ExamYear.fromJson(Map<String, dynamic> json) {
    return ExamYear(
      id: json['id'] as String? ?? '',
      year: json['year'] as String? ?? '',
    );
  }
}

/// FAQ item.
class Faq {
  final String id;
  final String question;
  final String answer;
  final String? category;

  Faq({
    required this.id,
    required this.question,
    required this.answer,
    this.category,
  });

  factory Faq.fromJson(Map<String, dynamic> json) {
    return Faq(
      id: json['id'] as String? ?? '',
      question: json['question'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
      category: json['category'] as String?,
    );
  }
}

/// Testimonial.
class Testimonial {
  final String id;
  final String name;
  final String? role;
  final String? avatar;
  final String content;
  final double rating;

  Testimonial({
    required this.id,
    required this.name,
    this.role,
    this.avatar,
    required this.content,
    this.rating = 0,
  });

  factory Testimonial.fromJson(Map<String, dynamic> json) {
    return Testimonial(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      role: json['role'] as String?,
      avatar: json['avatar'] as String?,
      content: json['content'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Teacher/Moderator.
class TeacherModerator {
  final String id;
  final String name;
  final String? image;
  final String title;
  final String? institution;

  TeacherModerator({
    required this.id,
    required this.name,
    this.image,
    required this.title,
    this.institution,
  });

  factory TeacherModerator.fromJson(Map<String, dynamic> json) {
    return TeacherModerator(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      image: json['image'] as String?,
      title: json['title'] as String? ?? '',
      institution: json['institution'] as String?,
    );
  }
}

/// Navigation item.
class NavItem {
  final String id;
  final String label;
  final String route;
  final String icon;
  final String location;
  final int order;
  final bool isAuthOnly;
  final bool isAdminOnly;
  final bool isActive;

  NavItem({
    required this.id,
    required this.label,
    required this.route,
    required this.icon,
    required this.location,
    this.order = 0,
    this.isAuthOnly = false,
    this.isAdminOnly = false,
    this.isActive = true,
  });

  factory NavItem.fromJson(Map<String, dynamic> json) {
    return NavItem(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      route: json['route'] as String? ?? '',
      icon: json['icon'] as String? ?? '',
      location: json['location'] as String? ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0,
      isAuthOnly: json['isAuthOnly'] as bool? ?? false,
      isAdminOnly: json['isAdminOnly'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

/// Banner.
class Banner {
  final String id;
  final String title;
  final String? subtitle;
  final String? image;
  final String? link;
  final String? buttonText;
  final bool isActive;
  final int order;
  final DateTime? startDate;
  final DateTime? endDate;

  Banner({
    required this.id,
    required this.title,
    this.subtitle,
    this.image,
    this.link,
    this.buttonText,
    this.isActive = true,
    this.order = 0,
    this.startDate,
    this.endDate,
  });

  factory Banner.fromJson(Map<String, dynamic> json) {
    return Banner(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      image: json['image'] as String?,
      link: json['link'] as String?,
      buttonText: json['buttonText'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      order: (json['order'] as num?)?.toInt() ?? 0,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
    );
  }
}

/// Notice.
class Notice {
  final String id;
  final String title;
  final String? content;
  final String? pdfUrl;
  final String? linkUrl;
  final String? linkLabel;
  final String type;
  final String? thumbnail;
  final String? classLevel;
  final bool isPinned;
  final bool isActive;
  final int order;
  final DateTime? createdAt;

  Notice({
    required this.id,
    required this.title,
    this.content,
    this.pdfUrl,
    this.linkUrl,
    this.linkLabel,
    this.type = 'text',
    this.thumbnail,
    this.classLevel,
    this.isPinned = false,
    this.isActive = true,
    this.order = 0,
    this.createdAt,
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      linkLabel: json['linkLabel'] as String?,
      type: json['type'] as String? ?? 'text',
      thumbnail: json['thumbnail'] as String?,
      classLevel: json['classLevel'] as String?,
      isPinned: json['isPinned'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      order: (json['order'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

/// Public site stats.
class PublicStats {
  final int students;
  final int mcqs;
  final int lectures;
  final int cqs;
  final int exams;

  PublicStats({
    this.students = 0,
    this.mcqs = 0,
    this.lectures = 0,
    this.cqs = 0,
    this.exams = 0,
  });

  factory PublicStats.fromJson(Map<String, dynamic> json) {
    return PublicStats(
      students: (json['students'] as num?)?.toInt() ?? 0,
      mcqs: (json['mcqs'] as num?)?.toInt() ?? 0,
      lectures: (json['lectures'] as num?)?.toInt() ?? 0,
      cqs: (json['cqs'] as num?)?.toInt() ?? 0,
      exams: (json['exams'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Site configuration.
class SiteConfig {
  final String siteName;
  final String siteDescription;
  final String contactEmail;
  final String contactPhone;
  final String contactAddress;
  final String facebook;
  final String youtube;
  final String telegram;
  final String bkash;
  final String nagad;
  final String rocket;
  final String logo;
  final String favicon;
  final String heroBadge;
  final String heroTitle;
  final String heroSubtitle;
  final String statsSubtitle;
  final String footerDescription;
  final List<String> premiumFeatures;
  final List<String> mcqFeatures;
  final List<String> searchSuggestions;
  final SiteMessages messages;

  SiteConfig({
    required this.siteName,
    this.siteDescription = '',
    this.contactEmail = '',
    this.contactPhone = '',
    this.contactAddress = '',
    this.facebook = '',
    this.youtube = '',
    this.telegram = '',
    this.bkash = '',
    this.nagad = '',
    this.rocket = '',
    this.logo = '',
    this.favicon = '',
    this.heroBadge = '',
    this.heroTitle = '',
    this.heroSubtitle = '',
    this.statsSubtitle = '',
    this.footerDescription = '',
    this.premiumFeatures = const [],
    this.mcqFeatures = const [],
    this.searchSuggestions = const [],
    SiteMessages? messages,
  }) : messages = messages ?? SiteMessages();

  factory SiteConfig.fromJson(Map<String, dynamic> json) {
    return SiteConfig(
      siteName: json['siteName'] as String? ?? 'শিক্ষা বাংলা',
      siteDescription: json['siteDescription'] as String? ?? '',
      contactEmail: json['contactEmail'] as String? ?? '',
      contactPhone: json['contactPhone'] as String? ?? '',
      contactAddress: json['contactAddress'] as String? ?? '',
      facebook: json['facebook'] as String? ?? '',
      youtube: json['youtube'] as String? ?? '',
      telegram: json['telegram'] as String? ?? '',
      bkash: json['bkash'] as String? ?? '',
      nagad: json['nagad'] as String? ?? '',
      rocket: json['rocket'] as String? ?? '',
      logo: json['logo'] as String? ?? '',
      favicon: json['favicon'] as String? ?? '',
      heroBadge: json['heroBadge'] as String? ?? '',
      heroTitle: json['heroTitle'] as String? ?? '',
      heroSubtitle: json['heroSubtitle'] as String? ?? '',
      statsSubtitle: json['statsSubtitle'] as String? ?? '',
      footerDescription: json['footerDescription'] as String? ?? '',
      premiumFeatures: (json['premiumFeatures'] as List?)?.cast<String>() ?? [],
      mcqFeatures: (json['mcqFeatures'] as List?)?.cast<String>() ?? [],
      searchSuggestions: (json['searchSuggestions'] as List?)?.cast<String>() ?? [],
      messages: json['messages'] != null
          ? SiteMessages.fromJson(json['messages'] as Map<String, dynamic>)
          : null,
    );
  }
}

class SiteMessages {
  final String contentComingSoon;
  final String chaptersComingSoon;
  final String chapterContentSoon;
  final String mcqComingSoon;
  final String cqComingSoon;
  final String lectureComingSoon;
  final String boardComingSoon;
  final String contentLoadError;
  final String contentTypeSoon;
  final String noQuestionsFound;
  final String footerClassesSoon;
  final String footerContactSoon;
  final String subjectsComingSoon;

  SiteMessages({
    this.contentComingSoon = 'কন্টেন্ট শীঘ্রই আসবে',
    this.chaptersComingSoon = 'এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে',
    this.chapterContentSoon = 'এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে',
    this.mcqComingSoon = 'শীঘ্রই নতুন প্রশ্ন যোগ করা হবে',
    this.cqComingSoon = 'শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে',
    this.lectureComingSoon = 'শীঘ্রই নতুন লেকচার যোগ করা হবে',
    this.boardComingSoon = 'শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে',
    this.contentLoadError = 'কন্টেন্ট লোড করতে সমস্যা হয়েছে',
    this.contentTypeSoon = 'শীঘ্রই কন্টেন্ট আসবে',
    this.noQuestionsFound = 'কোনো প্রশ্ন পাওয়া যায়নি',
    this.footerClassesSoon = 'শীঘ্রই শ্রেণি যোগ করা হবে',
    this.footerContactSoon = 'শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে',
    this.subjectsComingSoon = 'এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে',
  });

  factory SiteMessages.fromJson(Map<String, dynamic> json) {
    return SiteMessages(
      contentComingSoon: json['contentComingSoon'] as String? ?? 'কন্টেন্ট শীঘ্রই আসবে',
      chaptersComingSoon: json['chaptersComingSoon'] as String? ?? 'এই বিষয়ের অধ্যায়সমূহ শীঘ্রই যোগ করা হবে',
      chapterContentSoon: json['chapterContentSoon'] as String? ?? 'এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে',
      mcqComingSoon: json['mcqComingSoon'] as String? ?? 'শীঘ্রই নতুন প্রশ্ন যোগ করা হবে',
      cqComingSoon: json['cqComingSoon'] as String? ?? 'শীঘ্রই নতুন সৃজনশীল প্রশ্ন যোগ করা হবে',
      lectureComingSoon: json['lectureComingSoon'] as String? ?? 'শীঘ্রই নতুন লেকচার যোগ করা হবে',
      boardComingSoon: json['boardComingSoon'] as String? ?? 'শীঘ্রই নতুন ক্লাস/প্রশ্ন যোগ করা হবে',
      contentLoadError: json['contentLoadError'] as String? ?? 'কন্টেন্ট লোড করতে সমস্যা হয়েছে',
      contentTypeSoon: json['contentTypeSoon'] as String? ?? 'শীঘ্রই কন্টেন্ট আসবে',
      noQuestionsFound: json['noQuestionsFound'] as String? ?? 'কোনো প্রশ্ন পাওয়া যায়নি',
      footerClassesSoon: json['footerClassesSoon'] as String? ?? 'শীঘ্রই শ্রেণি যোগ করা হবে',
      footerContactSoon: json['footerContactSoon'] as String? ?? 'শীঘ্রই যোগাযোগ তথ্য যোগ করা হবে',
      subjectsComingSoon: json['subjectsComingSoon'] as String? ?? 'এই শ্রেণির বিষয়সমূহ শীঘ্রই যোগ করা হবে',
    );
  }
}

/// Content type (from /api/content-types).
class ContentType {
  final String id;
  final String key;
  final String labelBn;
  final String labelEn;
  final String? description;
  final String icon;
  final String color;
  final String? lightColor;
  final String? textColor;
  final String? route;
  final String? paramKey;
  final String? buttonLabel;
  final bool showInChapterDetail;
  final bool isActive;
  final int order;

  ContentType({
    required this.id,
    required this.key,
    required this.labelBn,
    required this.labelEn,
    this.description,
    this.icon = 'BookOpen',
    this.color = 'bg-gray-500',
    this.lightColor,
    this.textColor,
    this.route,
    this.paramKey,
    this.buttonLabel,
    this.showInChapterDetail = true,
    this.isActive = true,
    this.order = 0,
  });

  factory ContentType.fromJson(Map<String, dynamic> json) {
    return ContentType(
      id: json['id'] as String? ?? '',
      key: json['key'] as String? ?? '',
      labelBn: json['labelBn'] as String? ?? '',
      labelEn: json['labelEn'] as String? ?? '',
      description: json['description'] as String?,
      icon: json['icon'] as String? ?? 'BookOpen',
      color: json['color'] as String? ?? 'bg-gray-500',
      lightColor: json['lightColor'] as String?,
      textColor: json['textColor'] as String?,
      route: json['route'] as String?,
      paramKey: json['paramKey'] as String?,
      buttonLabel: json['buttonLabel'] as String?,
      showInChapterDetail: json['showInChapterDetail'] as bool? ?? true,
      isActive: json['isActive'] as bool? ?? true,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}
