import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pawstore/utils/constants.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.delete(key: 'auth_token');
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<Response> sendOtp(String phone) async {
    return await _dio.post('/api/auth/send-otp', data: {'phone': phone});
  }

  Future<Response> verifyOtp(String phone, String otp) async {
    return await _dio.post(
      '/api/auth/verify-otp',
      data: {'phone': phone, 'otp': otp},
    );
  }

  Future<Response> getProducts({String? category}) async {
    final queryParams = category != null ? {'category': category} : null;
    return await _dio.get('/api/products', queryParameters: queryParams);
  }

  Future<Response> getProduct(int id) async {
    return await _dio.get('/api/products/$id');
  }

  Future<Response> createOrder(List<Map<String, dynamic>> items) async {
    return await _dio.post('/api/orders', data: {'items': items});
  }

  Future<Response> verifyPayment(Map<String, dynamic> data) async {
    return await _dio.post('/api/orders/verify', data: data);
  }

  Future<Response> getOrders() async {
    return await _dio.get('/api/orders');
  }

  Future<Response> getHomeData() async {
    return await _dio.get('/api/home');
  }
}
