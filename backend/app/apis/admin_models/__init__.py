# src/app/apis/admin_models/__init__.py

from fastapi import APIRouter

# Create a router for this API
router = APIRouter()


from pydantic import BaseModel
from typing import List, Dict, Optional, Any

# Admin models to support admin API functionality

class GameBase(BaseModel):
    """Base model for game creation/updates"""
    pair_id: Optional[str] = None
    company_a: Dict[str, str]
    company_b: Dict[str, str]
    prediction_date: str
    status: Optional[str] = "scheduled"
    

class GameCreateRequest(GameBase):
    """Model for creating a new game"""
    pass

class GameUpdateRequest(GameBase):
    """Model for updating an existing game"""
    pass

class GameResponse(GameBase):
    """Model for game responses"""
    pair_id: str

class SubmissionBase(BaseModel):
    """Base model for submission creation/updates"""
    submission_id: Optional[str] = None
    user_id: str
    pair_id: str
    prediction: str
    timestamp: str
    score: Optional[float] = 0.0
    
class SubmissionCreateRequest(SubmissionBase):
    """Model for creating a new submission"""
    pass

# Alias for backwards compatibility  
GameSubmissionRequest = SubmissionCreateRequest

class SubmissionUpdateRequest(SubmissionBase):
    """Model for updating an existing submission"""
    pass

# Alias for backwards compatibility
GameSubmissionUpdateRequest = SubmissionUpdateRequest

class SubmissionResponse(SubmissionBase):
    """Model for submission responses"""
    submission_id: str

# Alias for backwards compatibility
GameSubmissionResponse = SubmissionResponse

class RoleAssignmentRequest(BaseModel):
    """Model for assigning a role to a user"""
    role: str

class UserStatusUpdateRequest(BaseModel):
    """Model for updating a user's status"""
    status: str
    
# Alias for backwards compatibility
UserUpdateRequest = UserStatusUpdateRequest
    
class AdminRolesResponse(BaseModel):
    """Model for admin roles response"""
    roles: List[Dict[str, Any]]

# List response models
class GameSubmissionListResponse(BaseModel):
    """Model for list of game submissions"""
    submissions: List[SubmissionResponse]

class UserListResponse(BaseModel):
    """Model for list of users"""
    users: List[Dict[str, Any]]
