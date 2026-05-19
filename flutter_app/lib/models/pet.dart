class Pet {
  final int id;
  final int userId;
  final String name;
  final String species;
  final String? breed;
  final int? age;
  final double? weight;
  final String? imageUrl;

  Pet({
    required this.id,
    required this.userId,
    required this.name,
    required this.species,
    this.breed,
    this.age,
    this.weight,
    this.imageUrl,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      name: json['name'],
      species: json['species'],
      breed: json['breed'],
      age: json['age'],
      weight: json['weight'] != null ? double.parse(json['weight'].toString()) : null,
      imageUrl: json['image_url'] ?? json['imageUrl'],
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'species': species,
    'breed': breed,
    'age': age,
    'weight': weight,
  };

  String get speciesEmoji {
    switch (species.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐈';
      case 'bird': return '🐦';
      case 'fish': return '🐟';
      case 'rabbit': return '🐇';
      case 'hamster': return '🐹';
      default: return '🐾';
    }
  }
}
