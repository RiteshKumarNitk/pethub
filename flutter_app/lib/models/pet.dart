class Pet {
  final int id;
  final int userId;
  final String name;
  final String? breed;
  final String? dob;
  final String? photoUrl;
  final String? notes;

  Pet({
    required this.id,
    required this.userId,
    required this.name,
    this.breed,
    this.dob,
    this.photoUrl,
    this.notes,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id'],
      userId: json['user_id'],
      name: json['name'],
      breed: json['breed'],
      dob: json['dob'],
      photoUrl: json['photo_url'],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'breed': breed,
      'dob': dob,
      'photoUrl': photoUrl,
      'notes': notes,
    };
  }
}

class Vaccination {
  final int id;
  final int petId;
  final String vaccineName;
  final String dateGiven;
  final String? nextDue;

  Vaccination({
    required this.id,
    required this.petId,
    required this.vaccineName,
    required this.dateGiven,
    this.nextDue,
  });

  factory Vaccination.fromJson(Map<String, dynamic> json) {
    return Vaccination(
      id: json['id'],
      petId: json['pet_id'],
      vaccineName: json['vaccine_name'],
      dateGiven: json['date_given'],
      nextDue: json['next_due'],
    );
  }
}
