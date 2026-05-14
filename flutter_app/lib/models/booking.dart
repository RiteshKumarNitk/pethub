class Booking {
  final int id;
  final int? userId;
  final int? petId;
  final String service;
  final String date;
  final String timeSlot;
  final String status;
  final String? notes;

  Booking({
    required this.id,
    this.userId,
    this.petId,
    required this.service,
    required this.date,
    required this.timeSlot,
    required this.status,
    this.notes,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'],
      userId: json['user_id'],
      petId: json['pet_id'],
      service: json['service'],
      date: json['date'],
      timeSlot: json['time_slot'],
      status: json['status'],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'petId': petId,
      'service': service,
      'date': date,
      'timeSlot': timeSlot,
      'notes': notes,
    };
  }
}
