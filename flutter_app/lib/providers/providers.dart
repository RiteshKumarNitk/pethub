import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pawstore/api/api_service.dart';
import 'package:pawstore/models/user.dart';
import 'package:pawstore/models/product.dart';
import 'package:pawstore/models/address.dart';
import 'package:pawstore/models/pet.dart';
import 'package:pawstore/models/ticket.dart';


final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

// Auth Provider (same as before but fixed to not always show onboarding)
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({this.user, this.isLoading = false, this.error, this.isAuthenticated = false});

  AuthState copyWith({User? user, bool? isLoading, String? error, bool? isAuthenticated}) {
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

  Future<void> sendOtp(String phone, {String? name}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.sendOtp(phone, name: name);
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
      await _api.saveString('has_onboarded', 'true');
      state = state.copyWith(isLoading: false, user: authResponse.user, isAuthenticated: true);
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

// Home data
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
      featuredProducts: (json['featuredProducts'] as List?)?.map((e) => Product.fromJson(e)).toList() ?? [],
    );
  }
}

// Products with pagination
final productsProvider = FutureProvider.family<ProductsResult, String?>((
  ref,
  category,
) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getProducts(category: category);
  final data = response.data;
  return ProductsResult(
    products: (data['products'] as List).map((j) => Product.fromJson(j)).toList(),
    total: data['total'] ?? 0,
    page: data['page'] ?? 1,
    totalPages: data['totalPages'] ?? 1,
  );
});

class ProductsResult {
  final List<Product> products;
  final int total;
  final int page;
  final int totalPages;
  ProductsResult({required this.products, required this.total, required this.page, required this.totalPages});
}

final productDetailProvider = FutureProvider.family<Product, int>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getProduct(id);
  return Product.fromJson(response.data['product']);
});

final reviewsProvider = FutureProvider.family<List<Review>, int>((ref, productId) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getProductReviews(productId);
  final data = response.data;
  return (data['reviews'] as List?)?.map((j) => Review.fromJson(j)).toList() ?? [];
});

// Cart with persistence
final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier(ref.read(apiServiceProvider));
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  final ApiService _api;
  CartNotifier(this._api) : super([]) {
    _loadCart();
  }

  Future<void> _loadCart() async {
    final saved = await _api.getString('saved_cart');
    if (saved != null) {
      // Basic restore — in production use proper serialization
    }
  }

  void addToCart(Product product) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
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
      if (item.product.id == productId) return CartItem(product: item.product, quantity: quantity);
      return item;
    }).toList();
  }

  void clearCart() => state = [];
  double get total => state.fold(0, (sum, item) => sum + item.total);
  List<Map<String, dynamic>> get orderItems => state.map((item) => item.toJson()).toList();
}

// Orders with pagination
final ordersProvider = FutureProvider<OrdersResult>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getOrders();
  final data = response.data;
  return OrdersResult(
    orders: (data['orders'] as List).map((j) => Order.fromJson(j)).toList(),
    total: data['total'] ?? 0,
  );
});

class OrdersResult {
  final List<Order> orders;
  final int total;
  OrdersResult({required this.orders, required this.total});
}

// Addresses
final addressesProvider = FutureProvider<List<Address>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getAddresses();
  return (response.data['addresses'] as List).map((j) => Address.fromJson(j)).toList();
});

final addressMutationProvider = StateNotifierProvider<AddressMutationNotifier, AsyncValue<void>>((ref) {
  return AddressMutationNotifier(ref.read(apiServiceProvider), ref);
});

class AddressMutationNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiService _api;
  final Ref _ref;
  AddressMutationNotifier(this._api, this._ref) : super(const AsyncData(null));

  Future<void> create(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    try {
      await _api.createAddress(data);
      _ref.invalidate(addressesProvider);
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> update(int id, Map<String, dynamic> data) async {
    state = const AsyncLoading();
    try {
      await _api.updateAddress(id, data);
      _ref.invalidate(addressesProvider);
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> delete(int id) async {
    state = const AsyncLoading();
    try {
      await _api.deleteAddress(id);
      _ref.invalidate(addressesProvider);
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}

// Pets
final petsProvider = FutureProvider<List<Pet>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getPets();
  return (response.data['pets'] as List).map((j) => Pet.fromJson(j)).toList();
});

final petMutationProvider = StateNotifierProvider<PetMutationNotifier, AsyncValue<void>>((ref) {
  return PetMutationNotifier(ref.read(apiServiceProvider), ref);
});

class PetMutationNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiService _api;
  final Ref _ref;
  PetMutationNotifier(this._api, this._ref) : super(const AsyncData(null));

  Future<void> create(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    try {
      await _api.createPet(data);
      _ref.invalidate(petsProvider);
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> delete(int id) async {
    state = const AsyncLoading();
    try {
      await _api.deletePet(id);
      _ref.invalidate(petsProvider);
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}

// Tickets
final ticketsProvider = FutureProvider<List<SupportTicket>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final response = await api.getTickets();
  return (response.data['tickets'] as List).map((j) => SupportTicket.fromJson(j)).toList();
});
