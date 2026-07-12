"""
Order confirmation email — professional HTML template.

Call send_order_confirmation_email(order) right after an order is created.
The function fires in a background thread so SMTP latency never blocks the
API response.
"""

import logging
import threading
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


# ── HTML template ─────────────────────────────────────────────────────────────

def _build_html(order) -> str:
    """Build the full HTML email body for an order confirmation."""

    # Build the items rows
    items_rows = ""
    for item in order.items.select_related("menu_item").all():
        subtotal = item.unit_price * item.quantity
        items_rows += f"""
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">
            {item.menu_item.name}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555;text-align:center;">
            x{item.quantity}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;font-weight:600;">
            Rs {item.unit_price}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#f25f3a;text-align:right;font-weight:700;">
            Rs {subtotal}
          </td>
        </tr>"""

    # Delivery address
    if order.delivery_address:
        addr = (
            f"{order.delivery_address.full_address}, "
            f"{order.delivery_address.city}"
        )
    else:
        addr = "Not specified"

    # Payment method label
    payment_label = (
        "Cash on Delivery (COD)"
        if order.payment_method == "COD"
        else "eSewa (Online Payment)"
    )

    # Payment status badge colour
    status_colour = {
        "Paid":    "#22c55e",
        "Pending": "#f59e0b",
        "Failed":  "#ef4444",
    }.get(order.payment_status, "#6b7280")

    # Special instructions
    notes_block = ""
    if order.notes:
        notes_block = f"""
        <tr>
          <td colspan="2" style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
            <span style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;
                         letter-spacing:.5px;">Special Instructions</span><br>
            <span style="font-size:14px;color:#555;font-style:italic;">{order.notes}</span>
          </td>
        </tr>"""

    order_date = order.order_date.strftime("%d %B %Y, %I:%M %p")
    customer_name = order.customer.name

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed — QuickServer1</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f25f3a 0%,#e84d26 100%);
                        padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;
                           letter-spacing:-0.5px;margin-bottom:4px;">
                QuickServer1
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:1px;">
                FRESH FOOD, FAST DELIVERY
              </div>
            </td>
          </tr>

          <!-- Hero confirmation banner -->
          <tr>
            <td style="background:#fff8f6;padding:28px 40px;text-align:center;
                        border-bottom:2px solid #fde8e0;">
              <div style="font-size:42px;margin-bottom:8px;">🎉</div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">
                Order Confirmed!
              </h1>
              <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">
                Hey <strong style="color:#f25f3a;">{customer_name}</strong>, your order has been
                received and is being prepared. Get ready — delicious food is on its way!
              </p>
            </td>
          </tr>

          <!-- Order summary strip -->
          <tr>
            <td style="padding:20px 40px;background:#fafafa;border-bottom:1px solid #eee;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 8px;">
                    <div style="font-size:11px;font-weight:700;color:#999;
                                 text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">
                      Order ID
                    </div>
                    <div style="font-size:18px;font-weight:800;color:#f25f3a;">
                      #{order.id}
                    </div>
                  </td>
                  <td style="text-align:center;padding:0 8px;
                              border-left:1px solid #e5e5e5;border-right:1px solid #e5e5e5;">
                    <div style="font-size:11px;font-weight:700;color:#999;
                                 text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">
                      Order Date
                    </div>
                    <div style="font-size:13px;font-weight:600;color:#333;">
                      {order_date}
                    </div>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <div style="font-size:11px;font-weight:700;color:#999;
                                 text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">
                      Status
                    </div>
                    <div style="display:inline-block;background:#fff3cd;color:#856404;
                                 font-size:12px;font-weight:700;padding:3px 10px;
                                 border-radius:20px;">
                      {order.status}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items ordered -->
          <tr>
            <td style="padding:28px 40px;">
              <h2 style="margin:0 0 16px;font-size:15px;font-weight:800;color:#1a1a1a;
                          text-transform:uppercase;letter-spacing:.5px;">
                Items Ordered
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border-radius:8px;overflow:hidden;
                            border:1px solid #f0f0f0;">
                <thead>
                  <tr style="background:#f8f8f8;">
                    <th style="padding:10px 8px;text-align:left;font-size:12px;
                                font-weight:700;color:#888;text-transform:uppercase;
                                letter-spacing:.5px;">Item</th>
                    <th style="padding:10px 8px;text-align:center;font-size:12px;
                                font-weight:700;color:#888;text-transform:uppercase;
                                letter-spacing:.5px;">Qty</th>
                    <th style="padding:10px 8px;text-align:right;font-size:12px;
                                font-weight:700;color:#888;text-transform:uppercase;
                                letter-spacing:.5px;">Price</th>
                    <th style="padding:10px 8px;text-align:right;font-size:12px;
                                font-weight:700;color:#888;text-transform:uppercase;
                                letter-spacing:.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items_rows}
                </tbody>
                <tfoot>
                  <tr style="background:#fff8f6;">
                    <td colspan="3"
                        style="padding:14px 8px;font-size:15px;font-weight:800;
                               color:#1a1a1a;text-align:right;">
                      Order Total
                    </td>
                    <td style="padding:14px 8px;font-size:18px;font-weight:800;
                                color:#f25f3a;text-align:right;">
                      Rs {order.total_amount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Delivery & payment details -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8f8f8;">
                  <th colspan="2"
                      style="padding:10px 14px;text-align:left;font-size:12px;
                             font-weight:700;color:#888;text-transform:uppercase;
                             letter-spacing:.5px;">
                    Delivery & Payment Details
                  </th>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;
                              color:#888;border-bottom:1px solid #f0f0f0;width:40%;">
                    Delivery Address
                  </td>
                  <td style="padding:12px 14px;font-size:14px;color:#333;
                              border-bottom:1px solid #f0f0f0;">
                    {addr}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;
                              color:#888;border-bottom:1px solid #f0f0f0;">
                    Payment Method
                  </td>
                  <td style="padding:12px 14px;font-size:14px;color:#333;
                              border-bottom:1px solid #f0f0f0;">
                    {payment_label}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;
                              color:#888;border-bottom:1px solid #f0f0f0;">
                    Payment Status
                  </td>
                  <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;">
                    <span style="display:inline-block;background:{status_colour}20;
                                  color:{status_colour};font-size:12px;font-weight:700;
                                  padding:3px 10px;border-radius:20px;">
                      {order.payment_status}
                    </span>
                  </td>
                </tr>
                {notes_block}
              </table>
            </td>
          </tr>

          <!-- COD reminder (only shown for COD orders) -->
          {"" if order.payment_method != "COD" else """
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;
                           padding:14px 18px;font-size:13px;color:#856404;line-height:1.6;">
                <strong>Reminder:</strong> Please keep
                <strong>Rs """ + str(order.total_amount) + """</strong> ready in cash for the
                delivery personnel.
              </div>
            </td>
          </tr>"""}

          <!-- Thank you message -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0 0 12px;font-size:15px;color:#555;line-height:1.7;">
                Thank you for ordering with <strong>QuickServer1</strong>!
                Your food is being freshly prepared and will be delivered to you soon.
              </p>
              <p style="margin:0;font-size:13px;color:#999;">
                If you have any questions, reply to this email or contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#aaa;">
                &copy; 2025 QuickServer1. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#666;">
                Pokhara, Nepal &nbsp;|&nbsp; support@quickserver1.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""


def _build_plain(order) -> str:
    """Fallback plain-text version of the confirmation email."""
    lines = [
        "ORDER CONFIRMED — QuickServer1",
        "=" * 50,
        f"Hi {order.customer.name},",
        "",
        "Your order has been placed successfully!",
        "",
        f"Order ID   : #{order.id}",
        f"Order Date : {order.order_date.strftime('%d %B %Y, %I:%M %p')}",
        f"Status     : {order.status}",
        "",
        "ITEMS ORDERED",
        "-" * 40,
    ]
    for item in order.items.select_related("menu_item").all():
        lines.append(f"  {item.menu_item.name} x{item.quantity}  —  Rs {item.unit_price * item.quantity}")
    lines += [
        "-" * 40,
        f"  TOTAL  :  Rs {order.total_amount}",
        "",
        "DELIVERY DETAILS",
    ]
    if order.delivery_address:
        lines.append(f"  Address : {order.delivery_address.full_address}, {order.delivery_address.city}")
    lines += [
        f"  Payment : {'Cash on Delivery (COD)' if order.payment_method == 'COD' else 'eSewa'}",
        f"  Payment Status : {order.payment_status}",
        "",
    ]
    if order.notes:
        lines += [f"  Notes: {order.notes}", ""]
    lines += [
        "Thank you for ordering with QuickServer1!",
        "Your food is being prepared and will be delivered shortly.",
        "",
        "QuickServer1 — Pokhara, Nepal",
    ]
    return "\n".join(lines)


# ── Public function ───────────────────────────────────────────────────────────

def send_order_confirmation_email(order) -> None:
    """
    Send an order confirmation email to the customer.

    Fires in a daemon thread so SMTP latency does NOT delay the API response.
    Silently logs errors — a failed email must never cause a 500 error.

    Args:
        order: A fully saved Order instance with items already created.
    """
    # Resolve recipient email (customer profile email → Django user email → skip)
    recipient = None
    try:
        recipient = order.customer.email or order.customer.user.email
    except Exception:
        pass

    if not recipient:
        logger.warning("Order #%s: no email address on record — skipping confirmation email.", order.id)
        return

    def _send():
        try:
            subject = f"Order Confirmed! #{order.id} — QuickServer1"
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@quickserver1.com")

            msg = EmailMultiAlternatives(
                subject=subject,
                body=_build_plain(order),
                from_email=from_email,
                to=[recipient],
            )
            msg.attach_alternative(_build_html(order), "text/html")
            msg.send(fail_silently=False)

            logger.info(
                "Order confirmation email sent to %s for order #%s.",
                recipient, order.id,
            )
            print(f"[EMAIL] Sent order #{order.id} confirmation to {recipient}", flush=True)

        except Exception as exc:  # noqa: BLE001
            # Never raise — a failed email must not break the checkout flow
            logger.error(
                "Failed to send order confirmation email for order #%s to %s: %s",
                order.id, recipient, exc,
            )
            # Also print directly so it's visible even without logging config
            print(
                f"[EMAIL ERROR] Order #{order.id} to {recipient}: {exc}",
                flush=True,
            )

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
