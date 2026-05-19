class Product {
  final int id;
  final String name;
  final String? description;
  final double price;
  final String category;
  final String? petType;
  final int stock;
  final String? imageUrl;
  final bool active;
  final double? avgRating;
  final int? reviewCount;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.category,
    this.petType,
    required this.stock,
    this.imageUrl,
    required this.active,
    this.avgRating,
    this.reviewCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: double.parse(json['price'].toString()),
      category: json['category'],
      petType: json['pet_type'],
      stock: json['stock'] ?? 0,
      imageUrl: json['image_url'],
      active: json['active'] ?? true,
      avgRating: json['avgRating'] != null ? double.parse(json['avgRating'].toString()) : null,
      reviewCount: json['reviewCount'],
    );
  }
}

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get total => product.price * quantity;

  Map<String, dynamic> toJson() => {
    'productId': product.id,
    'qty': quantity,
  };
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
  final double? discountAmount;
  final String status;
  final String? razorpayOrderId;
  final DateTime createdAt;
  final List<OrderItem>? items;

  Order({
    required this.id,
    required this.userId,
    required this.total,
    this.discountAmount,
    this.razorpayOrderId,
    required this.status,
    required this.createdAt,
    this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      userId: json['user_id'],
      total: double.parse(json['total'].toString()),
      discountAmount: json['discount_amount'] != null ? double.parse(json['discount_amount'].toString()) : null,
      status: json['status'],
      razorpayOrderId: json['razorpay_order_id'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      items: json['items'] != null
          ? (json['items'] as List).map((e) => OrderItem.fromJson(e)).toList()
          : null,
    );
  }
}

class Review {
  final int id;
  final int userId;
  final int rating;
  final String? comment;
  final String? userName;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.userId,
    required this.rating,
    this.comment,
    this.userName,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      rating: json['rating'],
      comment: json['comment'],
      userName: json['user_name'] ?? json['userName'],
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
