class SupportTicket {
  final int id;
  final int userId;
  final String subject;
  final String message;
  final String status;
  final String? adminReply;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? userName;

  SupportTicket({
    required this.id,
    required this.userId,
    required this.subject,
    required this.message,
    required this.status,
    this.adminReply,
    required this.createdAt,
    this.updatedAt,
    this.userName,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      subject: json['subject'],
      message: json['message'],
      status: json['status'],
      adminReply: json['admin_reply'] ?? json['adminReply'],
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      userName: json['user_name'] ?? json['userName'],
    );
  }
}
