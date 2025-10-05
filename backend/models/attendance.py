from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime, timezone

class AttendanceIn(BaseModel):
    """
    Input model for recording an attendance event.
    """
    student_id: str
    
    # Use a default_factory to generate a new timestamp for each instance.
    # Using timezone.utc ensures the timestamp is timezone-aware.
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Use Literal to restrict the possible values for 'status'.
    # This prevents invalid data like 'presentt' or 'Present'.
    status: Literal['present', 'absent', 'late'] = 'present'
    
    # Use Literal for 'source' to ensure data consistency.
    source: Literal['recognition', 'manual', 'import'] = 'recognition'