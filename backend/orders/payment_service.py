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
    # Payment form is submitted to rc-epay; transaction status is queried at rc.
    PAYMENT_FORM_BASE_URL = "https://rc-epay.esewa.com.np"
    VERIFICATION_BASE_URL = "https://rc.esewa.com.np"

    def __init__(self):
        self.merchant_code = os.environ.get("ESEWA_MERCHANT_CODE", "EPAYTEST")
        self.secret_key = os.environ.get("ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q")
        self.success_callback_url = os.environ.get(
            "ESEWA_SUCCESS_CALLBACK_URL",
            "http://localhost:5173/orders/payment-success",
        )
        self.failure_callback_url = os.environ.get(
            "ESEWA_FAILURE_CALLBACK_URL",
            "http://localhost:5173/orders/payment-failure",
        )

    # ────────────────────────────────────────────────────────────
    # Payment Initiation
    # ────────────────────────────────────────────────────────────

    def generate_transaction_uuid(self) -> str:
        """Generate a unique transaction UUID for each payment.

        eSewa only allows alphanumeric characters and hyphens.
        uuid4() produces exactly that format.
        """
        return str(uuid.uuid4())

    def generate_signature(self, data: Dict[str, str]) -> str:
        """
        Generate HMAC-SHA256 signature per eSewa ePay v2 specification.

        The message string MUST be:
            total_amount=<val>,transaction_uuid=<val>,product_code=<val>

        The signed_field_names list order must match this exact order.
        """
        message = (
            f"total_amount={data['total_amount']},"
            f"transaction_uuid={data['transaction_uuid']},"
            f"product_code={data['product_code']}"
        )

        digest = hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).digest()

        return base64.b64encode(digest).decode("utf-8")

    def prepare_payment_form_data(
        self,
        order_id: int,
        amount: Decimal,
        transaction_uuid: str,
        customer_email: str = "",
        customer_phone: str = "",
    ) -> Dict[str, str]:
        """
        Prepare the payment form data to POST to eSewa.

        total_amount = amount + tax_amount + product_service_charge
                       + product_delivery_charge
        Since we use zero for tax/service/delivery charges, total_amount = amount.

        All monetary values are formatted as plain decimals with two places
        (e.g. "150.00") so the signature matches what eSewa receives.
        """
        # Format amount consistently to 2 decimal places
        formatted_amount = f"{float(amount):.2f}"

        data = {
            "amount": formatted_amount,
            "tax_amount": "0",
            "total_amount": formatted_amount,   # equals amount when charges are 0
            "transaction_uuid": transaction_uuid,
            "product_code": self.merchant_code,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": self.success_callback_url,
            "failure_url": self.failure_callback_url,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
        }

        data["signature"] = self.generate_signature(data)

        return data

    def get_payment_form_url(self) -> str:
        """URL for the eSewa payment form POST."""
        return f"{self.PAYMENT_FORM_BASE_URL}/api/epay/main/v2/form"

    # ────────────────────────────────────────────────────────────
    # Payment Verification
    # ────────────────────────────────────────────────────────────

    def verify_payment(
        self,
        transaction_uuid: str,
        total_amount: Optional[Decimal] = None,
        product_code: Optional[str] = None,
    ) -> Tuple[bool, Dict]:
        """
        Verify payment status with the eSewa transaction-status API.

        Official endpoint (sandbox):
            GET https://rc.esewa.com.np/api/epay/transaction/status/
                ?product_code=EPAYTEST&total_amount=100&transaction_uuid=xxx

        The API returns a flat JSON object — there is no nested "data" wrapper:
            {
                "product_code": "EPAYTEST",
                "transaction_uuid": "...",
                "total_amount": 100.0,
                "status": "COMPLETE",
                "ref_id": "0007G36"
            }

        Returns:
            (True, response_dict)  when status == "COMPLETE"
            (False, response_dict) otherwise, including on network errors
        """
        if not product_code:
            product_code = self.merchant_code

        url = f"{self.VERIFICATION_BASE_URL}/api/epay/transaction/status/"

        params = {
            "product_code": product_code,
            "transaction_uuid": transaction_uuid,
        }
        if total_amount is not None:
            params["total_amount"] = f"{float(total_amount):.2f}"

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # The top-level "status" field IS the payment status (not a wrapper)
            is_successful = data.get("status") == "COMPLETE"

            return is_successful, data

        except requests.RequestException as e:
            return False, {"error": str(e), "status": "failed"}

    # ────────────────────────────────────────────────────────────
    # Response helpers
    # ────────────────────────────────────────────────────────────

    def extract_transaction_code(self, response_data: Dict) -> Optional[str]:
        """
        Extract the transaction reference from an eSewa verification response.

        eSewa calls this field "ref_id" in the flat response body.
        We store it in our Order.transaction_code field.
        """
        return response_data.get("ref_id")

    def extract_total_amount(self, response_data: Dict) -> Optional[Decimal]:
        """Extract total_amount from a flat eSewa verification response."""
        amount = response_data.get("total_amount")
        if amount is not None:
            try:
                return Decimal(str(amount))
            except Exception:
                pass
        return None

    # ────────────────────────────────────────────────────────────
    # Callback validation (used by success/failure callback views)
    # ────────────────────────────────────────────────────────────

    def validate_callback_data(self, data: Dict) -> Tuple[bool, str]:
        """
        Basic check that the callback from eSewa has required fields.

        eSewa sends callback data as a Base64-encoded JSON string in the
        `data` query parameter. The frontend decodes it; this validates
        that the decoded payload has the minimum required fields.
        """
        required_fields = ["transaction_uuid", "status"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
        return True, "Callback data is valid"
