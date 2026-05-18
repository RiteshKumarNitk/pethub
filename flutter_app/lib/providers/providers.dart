import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawstore/api/api_service.dart';
import 'package:pawstore/models/user.dart';
import 'package:pawstore/models/product.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api;

  AuthNotifier(this._api) : super(AuthState());

  Future<void> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.sendOtp(phone);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> verifyOtp(String phone, String otp) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.verifyOtp(phone, otp);
      final authResponse = AuthResponse.fromJson(response.data);
      await _api.setToken(authResponse.token);
      state = state.copyWith(
        isLoading: false,
        user: authResponse.user,
        isAuthenticated: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _api.clearToken();
    state = AuthState();
  }
}

final homeDataProvider = FutureProvider<HomeData>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getHomeData();
  return HomeData.fromJson(response.data);
});

class HomeData {
  final List<Product> featuredProducts;

  HomeData({required this.featuredProducts});

  factory HomeData.fromJson(Map<String, dynamic> json) {
    return HomeData(
      featuredProducts:
          (json['featuredProducts'] as List?)
              ?.map((e) => Product.fromJson(e))
              .toList() ??
          [],
    );
  }
}

final productsProvider = FutureProvider.family<List<Product>, String?>((
  ref,
  category,
) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getProducts(category: category);
  return (response.data['products'] as List)
      .map((json) => Product.fromJson(json))
      .toList();
});

final productDetailProvider = FutureProvider.family<Product, int>((
  ref,
  id,
) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getProduct(id);
  return Product.fromJson(response.data['product']);
});

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addToCart(Product product) {
    final existingIndex = state.indexWhere(
      (item) => item.product.id == product.id,
    );
    if (existingIndex >= 0) {
      final updated = [...state];
      updated[existingIndex].quantity++;
      state = updated;
    } else {
      state = [...state, CartItem(product: product)];
    }
  }

  void removeFromCart(int productId) {
    state = state.where((item) => item.product.id != productId).toList();
  }

  void updateQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    state = state.map((item) {
      if (item.product.id == productId) {
        return CartItem(product: item.product, quantity: quantity);
      }
      return item;
    }).toList();
  }

  void clearCart() {
    state = [];
  }

  double get total => state.fold(0, (sum, item) => sum + item.total);
}

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getOrders();
  return (response.data['orders'] as List)
      .map((json) => Order.fromJson(json))
      .toList();
});
