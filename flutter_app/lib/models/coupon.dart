class CouponValidation {
  final bool valid;
  final int? discountPercent;
  final double? discountFlat;
  final double? minOrderAmount;
  final String? code;
  final String? error;

  CouponValidation({
    required this.valid,
    this.discountPercent,
    this.discountFlat,
    this.minOrderAmount,
    this.code,
    this.error,
  });

  factory CouponValidation.fromJson(Map<String, dynamic> json) {
    return CouponValidation(
      valid: json['valid'] ?? false,
      discountPercent: json['discount_percent'],
      discountFlat: json['discount_flat'] != null ? double.parse(json['discount_flat'].toString()) : null,
      minOrderAmount: json['min_order_amount'] != null ? double.parse(json['min_order_amount'].toString()) : null,
      code: json['code'],
      error: json['error'],
    );
  }
}
