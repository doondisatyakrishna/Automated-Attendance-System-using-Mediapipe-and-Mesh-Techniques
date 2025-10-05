import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_verification_email(to_email: str, username: str, code: str):
    """Sends a verification email to a new user using SendGrid."""
    
    # Get the API key and sender email from your .env file
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")

    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        print("ERROR: SendGrid API Key or Sender Email not configured.")
        return

    # This is a simple HTML template for the email.
    # You can make this much more beautiful by using SendGrid's template features.
    message_body = f"""
    <html>
    <body>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Welcome to MegaEvolution, {username}!</h2>
            <p>Thank you for signing up. Please use the following verification code to activate your account:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">{code}</p>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not sign up for this account, you can safely ignore this email.</p>
            <br>
            <p>Best regards,</p>
            <p>The MegaEvolution Team</p>
        </div>
    </body>
    </html>
    """

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject='Your Account Verification Code',
        html_content=message_body
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent to {to_email}, Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")