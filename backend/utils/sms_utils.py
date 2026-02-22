import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Initialize the Twilio Client ---
try:
    TWILIO_ACCOUNT_SID = os.environ['TWILIO_ACCOUNT_SID']
    TWILIO_AUTH_TOKEN = os.environ['TWILIO_AUTH_TOKEN']
    TWILIO_VERIFY_SERVICE_SID = os.environ['TWILIO_VERIFY_SERVICE_SID']

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    verify_service = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)

except KeyError as e:
    raise RuntimeError(f"Twilio environment variable not set: {e}")

def send_verification_sms(phone_number: str):
    """Send a verification code via SMS."""
    try:
        verify_service.verifications.create(to=phone_number, channel='sms')
        return {"status": "success", "message": f"Verification code sent to {phone_number}"}
    except TwilioRestException as e:
        print(f"Twilio error: {e}")
        return {"status": "error", "message": "Failed to send SMS. Invalid number or service SID."}

def check_verification_code(phone_number: str, code: str) -> bool:
    """Verify the OTP code for the given phone number."""
    try:
        verification_check = verify_service.verification_checks.create(to=phone_number, code=code)
        return verification_check.status == "approved"
    except TwilioRestException as e:
        print(f"Twilio error: {e}")
        return False
