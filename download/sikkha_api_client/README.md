# শিক্ষা বাংলা Flutter API Client

Official Flutter API client for [শিক্ষা বাংলা (Sikkha Bangla)](https://sikkhabangla.com) — Bangladesh's online education platform.

## Features

- 🔐 Cookie-based authentication (Supabase Auth)
- 📦 Typed models for all API resources
- 🔄 Request/response interceptors
- ⏱️ Rate-limit awareness
- 🛡️ CSRF token management for mutations
- 📄 Pagination support
- 🌐 Bengali locale error messages

## Getting Started

```dart
import 'package:sikkha_api_client/sikkha_api_client.dart';

// Create the client
final client = SikkhaApiClient(
  baseUrl: 'https://sikkhabangla.com',
);

// Login
final authService = AuthService(client);
final user = await authService.login(email: 'user@example.com', password: 'password123');

// Fetch classes
final contentService = ContentService(client);
final classes = await contentService.getClasses();
```

## Architecture

```
lib/
├── sikkha_api_client.dart     # Barrel export
└── src/
    ├── client.dart             # HTTP client with interceptors
    ├── exceptions.dart         # Typed exceptions
    ├── models/                 # Data models (DTOs)
    │   ├── auth.dart
    │   ├── user.dart
    │   ├── content.dart
    │   ├── mcq.dart
    │   ├── cq.dart
    │   ├── lecture.dart
    │   ├── exam.dart
    │   ├── payment.dart
    │   └── admin.dart
    └── services/               # API service classes
        ├── auth_service.dart
        ├── user_service.dart
        ├── content_service.dart
        ├── mcq_service.dart
        ├── cq_service.dart
        ├── lecture_service.dart
        ├── exam_service.dart
        ├── payment_service.dart
        ├── search_service.dart
        └── admin_service.dart
```
