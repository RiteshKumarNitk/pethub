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

  Future<void> saveString(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> getString(String key) async {
    return await _storage.read(key: key);
  }

  // Auth
  Future<Response> sendOtp(String phone, {String? name}) async {
    return await _dio.post('/api/auth/send-otp', data: {'phone': phone, 'name': name});
  }

  Future<Response> verifyOtp(String phone, String otp) async {
    return await _dio.post('/api/auth/verify-otp', data: {'phone': phone, 'otp': otp});
  }

  Future<Response> logout() async {
    return await _dio.post('/api/auth/logout');
  }

  // Products
  Future<Response> getProducts({String? category, String? petType, String? search, int page = 1, int limit = 20}) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (category != null && category != 'All') params['category'] = category;
    if (petType != null) params['petType'] = petType;
    if (search != null && search.isNotEmpty) params['search'] = search;
    return await _dio.get('/api/products', queryParameters: params);
  }

  Future<Response> getProduct(int id) async {
    return await _dio.get('/api/products/$id');
  }

  Future<Response> getProductReviews(int id, {int page = 1, int limit = 10}) async {
    return await _dio.get('/api/products/$id/reviews', queryParameters: {'page': page, 'limit': limit});
  }

  Future<Response> createReview(int productId, int rating, String comment) async {
    return await _dio.post('/api/products/$productId/reviews', data: {'rating': rating, 'comment': comment});
  }

  // Orders
  Future<Response> createOrder(List<Map<String, dynamic>> items, {String? couponCode, int? addressId}) async {
    final data = <String, dynamic>{'items': items};
    if (couponCode != null) data['couponCode'] = couponCode;
    if (addressId != null) data['addressId'] = addressId;
    return await _dio.post('/api/orders', data: data);
  }

  Future<Response> verifyPayment(Map<String, dynamic> data) async {
    return await _dio.post('/api/orders/verify', data: data);
  }

  Future<Response> getOrders({int page = 1, int limit = 20}) async {
    return await _dio.get('/api/orders', queryParameters: {'page': page, 'limit': limit});
  }

  Future<Response> cancelOrder(int orderId) async {
    return await _dio.put('/api/orders', data: {'orderId': orderId, 'status': 'cancelled'});
  }

  // Home
  Future<Response> getHomeData() async {
    return await _dio.get('/api/home');
  }

  // Addresses
  Future<Response> getAddresses() async {
    return await _dio.get('/api/addresses');
  }

  Future<Response> createAddress(Map<String, dynamic> data) async {
    return await _dio.post('/api/addresses', data: data);
  }

  Future<Response> updateAddress(int id, Map<String, dynamic> data) async {
    return await _dio.put('/api/addresses/$id', data: data);
  }

  Future<Response> deleteAddress(int id) async {
    return await _dio.delete('/api/addresses/$id');
  }

  // Coupons
  Future<Response> validateCoupon(String code) async {
    return await _dio.post('/api/coupons', data: {'code': code});
  }

  // Pets
  Future<Response> getPets() async {
    return await _dio.get('/api/pets');
  }

  Future<Response> createPet(Map<String, dynamic> data) async {
    return await _dio.post('/api/pets', data: data);
  }

  Future<Response> updatePet(int id, Map<String, dynamic> data) async {
    return await _dio.put('/api/pets/$id', data: data);
  }

  Future<Response> deletePet(int id) async {
    return await _dio.delete('/api/pets/$id');
  }

  // Support Tickets
  Future<Response> getTickets() async {
    return await _dio.get('/api/tickets');
  }

  Future<Response> createTicket(String subject, String message) async {
    return await _dio.post('/api/tickets', data: {'subject': subject, 'message': message});
  }

  // Upload
  Future<Response> uploadImage(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post('/api/upload', data: formData);
  }
}
