import 'package:dio/dio.dart';

import '../utils/constants.dart';
import 'secure_storage_service.dart';

/// Client dùng chung cho MỌI lời gọi API tới Backend thật — tương đương
/// `web/src/services/apiClient.ts` bên Web (cùng format, cùng cách xử lý lỗi).
///
/// - Gắn JWT tự động vào header Authorization (đọc từ SecureStorageService).
/// - Backend luôn trả bọc {success, data, message} (xem 02-BACKEND-SPEC.md) —
///   unwrap tại request().
/// - 401 (token thiếu/hết hạn) => xoá token + gọi handler đã đăng ký (AuthProvider,
///   Giai đoạn B) để điều hướng về màn Đăng nhập. ApiClient KHÔNG tự import
///   go_router để tránh phụ thuộc ngược, giống nguyên tắc bên Web.
class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);

  @override
  String toString() => message;
}

typedef UnauthorizedHandler = void Function();

class ApiClient {
  ApiClient._() {
    _dio = Dio(BaseOptions(baseUrl: apiBaseUrl));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.instance.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          if (status == 401) {
            await SecureStorageService.instance.clearToken();
            _unauthorizedHandler?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  static final instance = ApiClient._();

  late final Dio _dio;
  UnauthorizedHandler? _unauthorizedHandler;

  /// AuthProvider (Giai đoạn B) gọi 1 lần lúc khởi tạo để nhận thông báo khi cần
  /// điều hướng về màn Đăng nhập.
  void setUnauthorizedHandler(UnauthorizedHandler? handler) {
    _unauthorizedHandler = handler;
  }

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
    return e.message ?? 'Lỗi kết nối tới máy chủ';
  }

  /// Gọi Backend rồi unwrap thẳng field `data` bên trong envelope {success,data,message}.
  Future<T> request<T>({
    required String method,
    required String path,
    Map<String, dynamic>? queryParameters,
    dynamic data,
    Options? options,
  }) async {
    try {
      final response = await _dio.request<Map<String, dynamic>>(
        path,
        queryParameters: queryParameters,
        data: data,
        options: (options ?? Options()).copyWith(method: method),
      );
      final body = response.data;
      if (body == null) {
        throw ApiException('Phản hồi rỗng từ máy chủ', response.statusCode);
      }
      return body['data'] as T;
    } on DioException catch (e) {
      throw ApiException(_extractMessage(e), e.response?.statusCode);
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? queryParameters}) =>
      request<T>(method: 'GET', path: path, queryParameters: queryParameters);

  Future<T> post<T>(String path, {dynamic data, Options? options}) =>
      request<T>(method: 'POST', path: path, data: data, options: options);

  Future<T> put<T>(String path, {dynamic data}) =>
      request<T>(method: 'PUT', path: path, data: data);

  Future<T> delete<T>(String path) => request<T>(method: 'DELETE', path: path);
}
