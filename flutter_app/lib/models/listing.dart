class PetListing {
  final int id;
  final int userId;
  final String source;
  final String breed;
  final int ageMonths;
  final double price;
  final String? description;
  final String contactPhone;
  final bool isApproved;
  final List<String>? images;
  final DateTime createdAt;

  PetListing({
    required this.id,
    required this.userId,
    required this.source,
    required this.breed,
    required this.ageMonths,
    required this.price,
    this.description,
    required this.contactPhone,
    required this.isApproved,
    this.images,
    required this.createdAt,
  });

  factory PetListing.fromJson(Map<String, dynamic> json) {
    return PetListing(
      id: json['id'],
      userId: json['user_id'],
      source: json['source'],
      breed: json['breed'],
      ageMonths: json['age_months'],
      price: double.parse(json['price'].toString()),
      description: json['description'],
      contactPhone: json['contact_phone'],
      isApproved: json['is_approved'] == 'true' || json['is_approved'] == true,
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      createdAt: DateTime.parse(
        json['created_at'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  bool get isShop => source == 'shop';
  bool get isUserListed => source == 'user';
}
