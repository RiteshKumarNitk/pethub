class Product {
  final int id;
  final String name;
  final String? description;
  final double price;
  final String category;
  final int stock;
  final String? imageUrl;
  final bool active;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.category,
    required this.stock,
    this.imageUrl,
    required this.active,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: double.parse(json['price'].toString()),
      category: json['category'],
      stock: json['stock'] ?? 0,
      imageUrl: json['image_url'],
      active: json['active'] ?? true,
    );
  }
}

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get total => product.price * quantity;
}

class OrderItem {
  final int id;
  final int productId;
  final int qty;
  final double unitPrice;
  final String? productName;
  final String? productImage;

  OrderItem({
    required this.id,
    required this.productId,
    required this.qty,
    required this.unitPrice,
    this.productName,
    this.productImage,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      productId: json['productId'] ?? json['product_id'],
      qty: json['qty'],
      unitPrice: double.parse(
        json['unitPrice']?.toString() ?? json['unit_price']?.toString() ?? '0',
      ),
      productName: json['productName'] ?? json['product_name'],
      productImage: json['productImage'] ?? json['product_image'],
    );
  }
}

class Order {
  final int id;
  final int userId;
  final double total;
  final String status;
  final String? razorpayOrderId;
  final DateTime createdAt;
  final List<OrderItem>? items;

  Order({
    required this.id,
    required this.userId,
    required this.total,
    required this.status,
    this.razorpayOrderId,
    required this.createdAt,
    this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      userId: json['user_id'],
      total: double.parse(json['total'].toString()),
      status: json['status'],
      razorpayOrderId: json['razorpay_order_id'],
      createdAt: DateTime.parse(
        json['created_at'] ?? DateTime.now().toIso8601String(),
      ),
      items: json['items'] != null
          ? (json['items'] as List).map((e) => OrderItem.fromJson(e)).toList()
          : null,
    );
  }
}
