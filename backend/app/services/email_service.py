"""Email notification service using Resend."""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    if not settings.RESEND_API_KEY:
        return None
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        return resend
    except ImportError:
        logger.warning("resend package not installed. Email notifications disabled.")
        return None


def _base_html(title: str, body: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:28px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;">🎓</span>
                </td>
                <td style="padding-left:12px;">
                  <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">TestAP</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            {body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f5f3ff;border-top:1px solid #ede9fe;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © 2026 TestAP — Розумне тестування для освіти<br/>
              <a href="{settings.FRONTEND_URL}" style="color:#7c3aed;text-decoration:none;">{settings.FRONTEND_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_test_assigned(
    to_email: str,
    user_name: str,
    test_title: str,
    closes_at: Optional[str] = None,
) -> bool:
    client = _get_client()
    if not client:
        return False

    deadline_line = (
        f'<p style="margin:12px 0;font-size:15px;color:#4b5563;">📅 Термін здачі: <strong style="color:#7c3aed;">{closes_at}</strong></p>'
        if closes_at else ""
    )

    body = f"""
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Вам призначено новий тест</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">Привіт, <strong>{user_name}</strong>!</p>

        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em;">Тест</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">{test_title}</p>
          {deadline_line}
        </div>

        <a href="{settings.FRONTEND_URL}/tests"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#ffffff;font-weight:600;font-size:15px;border-radius:12px;text-decoration:none;">
          Перейти до тестів →
        </a>
    """

    try:
        client.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": f"Новий тест: {test_title}",
            "html": _base_html(f"Новий тест: {test_title}", body),
        })
        return True
    except Exception as e:
        logger.error(f"Failed to send test_assigned email to {to_email}: {e}")
        return False


async def send_deadline_reminder(
    to_email: str,
    user_name: str,
    test_title: str,
    closes_at: str,
) -> bool:
    client = _get_client()
    if not client:
        return False

    body = f"""
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Нагадування про дедлайн</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">Привіт, <strong>{user_name}</strong>! Не забудьте здати тест.</p>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Дедлайн завтра</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">{test_title}</p>
          <p style="margin:8px 0 0;font-size:15px;color:#4b5563;">Термін здачі: <strong style="color:#ea580c;">{closes_at}</strong></p>
        </div>

        <a href="{settings.FRONTEND_URL}/tests"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f97316,#ef4444);color:#ffffff;font-weight:600;font-size:15px;border-radius:12px;text-decoration:none;">
          Розпочати зараз →
        </a>
    """

    try:
        client.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": f"⏰ Нагадування: {test_title} — дедлайн завтра",
            "html": _base_html(f"Нагадування: {test_title}", body),
        })
        return True
    except Exception as e:
        logger.error(f"Failed to send deadline_reminder email to {to_email}: {e}")
        return False


async def send_email_verification(
    to_email: str,
    user_name: str,
    verify_url: str,
) -> bool:
    client = _get_client()
    if not client:
        return False

    body = f"""
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Підтвердіть пошту</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">Привіт, <strong>{user_name}</strong>! Дякуємо за реєстрацію в TestAP.</p>

        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Щоб активувати акаунт, натисніть кнопку нижче:</p>

        <a href="{verify_url}"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#ffffff;font-weight:600;font-size:15px;border-radius:12px;text-decoration:none;">
          Підтвердити email →
        </a>

        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Якщо кнопка не працює, скопіюйте посилання:<br/>
        <span style="color:#7c3aed;word-break:break-all;">{verify_url}</span></p>

        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Якщо ви не реєструвалися — просто проігноруйте цей лист.</p>
    """

    try:
        client.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": "Підтвердіть email на TestAP",
            "html": _base_html("Підтвердження email", body),
        })
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {to_email}: {e}")
        return False


async def send_result_ready(
    to_email: str,
    user_name: str,
    test_title: str,
    percent: float,
    passed: bool,
) -> bool:
    client = _get_client()
    if not client:
        return False

    status_color = "#059669" if passed else "#e11d48"
    status_text = "Пройдено ✓" if passed else "Не пройдено ✗"

    body = f"""
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Результат тесту готовий</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">Привіт, <strong>{user_name}</strong>! Ваш результат:</p>

        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:15px;color:#6b7280;">{test_title}</p>
          <p style="margin:8px 0;font-size:48px;font-weight:700;color:#111827;">{round(percent)}%</p>
          <span style="display:inline-block;padding:6px 16px;background:{status_color};color:#ffffff;font-weight:600;font-size:14px;border-radius:999px;">{status_text}</span>
        </div>

        <a href="{settings.FRONTEND_URL}/history"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#ffffff;font-weight:600;font-size:15px;border-radius:12px;text-decoration:none;">
          Переглянути деталі →
        </a>
    """

    try:
        client.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": f"Результат тесту: {test_title} — {round(percent)}%",
            "html": _base_html(f"Результат: {test_title}", body),
        })
        return True
    except Exception as e:
        logger.error(f"Failed to send result_ready email to {to_email}: {e}")
        return False
