import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# --- Initialize the Twilio Client ---
try:
    # Load the credentials from your .env file
    TWILIO_ACCOUNT_SID = os.environ['TWILIO_ACCOUNT_SID']
    TWILIO_AUTH_TOKEN = os.environ['TWILIO_AUTH_TOKEN']
    TWILIO_VERIFY_SERVICE_SID = os.environ['TWILIO_VERIFY_SERVICE_SID']
    
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    verify_service = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)

except KeyError as e:
    # This provides a clear error if a .env variable is missing
    raise RuntimeError(f"Twilio environment variable not set: {e}")


def send_verification_sms(phone_number: str):
    """Sends a verification code to the given phone number using Twilio Verify."""
    try:
        # Twilio handles the code generation and sending in one step
        verify_service.verifications.create(to=phone_number, channel='sms')
        return {"status": "success", "message": f"Verification code sent to {phone_number}"}
    except TwilioRestException as e:
        # Handle common Twilio errors, like an invalid phone number
        print(f"Twilio error: {e}")
        return {"status": "error", "message": "Failed to send SMS. The phone number may be invalid."}


def check_verification_code(phone_number: str, code: str) -> bool:
    """Checks if the provided verification code is valid for the phone number."""
    try:
        # Ask Twilio to check the code
        verification_check = verify_service.verification_checks.create(to=phone_number, code=code)
        # The status will be "approved" if the code is correct
        return verification_check.status == "approved"
    except TwilioRestException as e:
        # If the code is invalid or expired, Twilio will return an error
        print(f"Twilio error: {e}")
        return False