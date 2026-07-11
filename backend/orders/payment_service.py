"""
eSewa ePay v2 Payment Service

Handles payment initiation, verification, and callback processing
for the eSewa payment gateway in sandbox/test environment.
"""

import hmac
import hashlib
import base64
import os
import uuid
from decimal import Decimal
from typing import Dict, Optional, Tuple

import requests
from django.conf import settings


class eSewaPaymentService:
    """
    Service for handling eSewa ePay v2 payment operations.
    
    All operations use the sandbox environment for testing.
    """

    # eSewa Sandbox Configuration
    SANDBOX_BASE_URL = "https://rc-epay.esewa.com.np"
    
    def __init__(self):
        self.merchant_code = os.environ.get("ESEWA_MERCHANT_CODE", "EPAYTEST")
        self.secret_key = os.environ.get("ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q")
        self.success_callback_url = os.environ.get("ESEWA_SUCCESS_CALLBACK_URL")
        self.failure_callback_url = os.environ.get("ESEWA_FAILURE_CALLBACK_URL")

    # ────────────────────────────────────────────────────────────
    # Payment Initiation
    # ────────────────────────────────────────────────────────────

    def generate_transaction_uuid(self) -> str:
        """Generate a unique transaction UUID for each payment."""
        return str(uuid.uuid4())

def generate_signature(self, data: Dict[str, str]) -> str:
    """
    Generate HMAC-SHA256 signature according to eSewa ePay v2 specification.
    """
    message = (
        f"total_amount={data['total_amount']},"
        f"transaction_uuid={data['transaction_uuid']},"
        f"product_code={data['product_code']}"
    )

    digest = hmac.new(
        self.secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).digest()

    signature = base64.b64encode(digest).decode("utf-8")

    return signature

    def prepare_payment_form_data(
        self,
        order_id: int,
        amount: Decimal,
        transaction_uuid: str,
        customer_email: str,
        customer_phone: str,
    ) -> Dict[str, str]:
        """
        Prepare payment form data for eSewa payment page.
        
        Returns:
            Dictionary with all required fields for eSewa payment form
        """
        data = {
            "amount": str(amount),
            "failure_url": self.failure_callback_url,
            "product_code": self.merchant_code,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": self.success_callback_url,
            "tax_amount": "0",
            "total_amount": str(amount),
            "transaction_uuid": transaction_uuid,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
        }

        # Generate signature
        data["signature"] = self.generate_signature(data)

        return data

    def get_payment_form_url(self) -> str:
        """Get the eSewa payment form submission URL."""
        return f"{self.SANDBOX_BASE_URL}/api/epay/main/v2/form"

    # ────────────────────────────────────────────────────────────
    # Payment Verification
    # ────────────────────────────────────────────────────────────

    def verify_payment(
        self,
        transaction_uuid: str,
        product_code: Optional[str] = None,
    ) -> Tuple[bool, Dict]:
        """
        Verify payment status with eSewa API.
        
        Args:
            transaction_uuid: The transaction UUID from the payment attempt
            product_code: The product code (defaults to merchant code)
        
        Returns:
            Tuple of (success: bool, response_data: dict)
            
            Success response contains:
            {
                'data': {
                    'status': 'COMPLETE',
                    'transaction_uuid': '...',
                    'transaction_code': '...',
                    'total_amount': '...',
                    ...
                },
                'status': 'success'
            }
        """
        if not product_code:
            product_code = self.merchant_code

        url = f"{self.SANDBOX_BASE_URL}/api/epay/transaction/status/"
        
        payload = {
            "product_code": product_code,
            "transaction_uuid": transaction_uuid,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=10,
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Check if payment is successful
            is_successful = (
                data.get("status") == "success"
                and data.get("data", {}).get("status") == "COMPLETE"
            )
            
            return is_successful, data
            
        except requests.RequestException as e:
            # Return failure tuple with error info
            return False, {"error": str(e), "status": "failed"}

    # ────────────────────────────────────────────────────────────
    # Payment Validation
    # ────────────────────────────────────────────────────────────

    def validate_callback_data(self, data: Dict) -> Tuple[bool, str]:
        """
        Validate payment callback data from eSewa.
        
        Basic validation: check for required fields.
        Note: eSewa sandbox may not always include all fields in callback.
        
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        required_fields = ["transaction_uuid", "status"]
        
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            return False, f"Missing required fields: {', '.join(missing_fields)}"
        
        return True, "Callback data is valid"

    def extract_transaction_code(self, response_data: Dict) -> Optional[str]:
        """Extract transaction code from eSewa response."""
        return response_data.get("data", {}).get("transaction_code")

    def extract_total_amount(self, response_data: Dict) -> Optional[Decimal]:
        """Extract total amount from eSewa response."""
        amount = response_data.get("data", {}).get("total_amount")
        if amount:
            try:
                return Decimal(str(amount))
            except:
                pass
        return None
