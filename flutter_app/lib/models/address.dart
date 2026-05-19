class Address {
  final int id;
  final int userId;
  final String label;
  final String street;
  final String city;
  final String state;
  final String zip;
  final bool isDefault;

  Address({
    required this.id,
    required this.userId,
    required this.label,
    required this.street,
    required this.city,
    required this.state,
    required this.zip,
    required this.isDefault,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      label: json['label'] ?? 'Home',
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zip: json['zip'],
      isDefault: json['is_default'] ?? json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'label': label,
    'street': street,
    'city': city,
    'state': state,
    'zip': zip,
    'isDefault': isDefault,
  };

  String get fullAddress => '$street, $city, $state $zip';
}
