class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'NEXT_PUBLIC_API_URL',
    defaultValue: 'http://localhost:3000',
  );
}

class RazorpayConstants {
  static const String keyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: 'rzp_test_your_key_id',
  );
}

class CloudinaryConstants {
  static const String cloudName = String.fromEnvironment(
    'CLOUDINARY_CLOUD_NAME',
    defaultValue: 'your-cloud-name',
  );
  static const String uploadPreset = String.fromEnvironment(
    'CLOUDINARY_UPLOAD_PRESET',
    defaultValue: 'pawstore_uploads',
  );
}
