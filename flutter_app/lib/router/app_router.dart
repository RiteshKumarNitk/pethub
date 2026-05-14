import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pet_hub/api/api_service.dart';
import 'package:pet_hub/screens/auth/login_screen.dart';
import 'package:pet_hub/screens/auth/onboarding_screen.dart';
import 'package:pet_hub/screens/home/home_screen.dart';
import 'package:pet_hub/screens/pets/pet_profile_screen.dart';
import 'package:pet_hub/screens/pets/add_pet_screen.dart';
import 'package:pet_hub/screens/shop/shop_screen.dart';
import 'package:pet_hub/screens/shop/product_detail_screen.dart';
import 'package:pet_hub/screens/shop/cart_screen.dart';
import 'package:pet_hub/screens/marketplace/marketplace_screen.dart';
import 'package:pet_hub/screens/marketplace/sell_pet_screen.dart';
import 'package:pet_hub/screens/bookings/booking_screen.dart';
import 'package:pet_hub/screens/profile/profile_screen.dart';
import 'package:pet_hub/screens/profile/orders_screen.dart';
import 'package:pet_hub/screens/profile/my_listings_screen.dart';
import 'package:pet_hub/widgets/main_scaffold.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) async {
      final api = ApiService();
      final token = await api.getToken();

      if (state.matchedLocation == '/splash') {
        if (token != null) {
          return '/home';
        }
        return '/login';
      }

      if (state.matchedLocation == '/login' && token != null) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/shop',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ShopScreen()),
          ),
          GoRoute(
            path: '/marketplace',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: MarketplaceScreen()),
          ),
          GoRoute(
            path: '/bookings',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: BookingScreen()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),
      GoRoute(
        path: '/pet/:id',
        builder: (context, state) =>
            PetProfileScreen(petId: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/add-pet',
        builder: (context, state) => const AddPetScreen(),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (context, state) => ProductDetailScreen(
          productId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
      GoRoute(
        path: '/sell-pet',
        builder: (context, state) => const SellPetScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/my-listings',
        builder: (context, state) => const MyListingsScreen(),
      ),
    ],
  );
});

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFF6B35),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.pets, size: 80, color: Color(0xFFFF6B35)),
            ),
            const SizedBox(height: 20),
            const Text(
              'Pet Hub',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
