# This module has been deprecated and replaced by munyiq_api
# Keeping as a placeholder with a clear message to avoid import errors

from fastapi import APIRouter

# Initialize router with different prefix to avoid conflicts
router = APIRouter(prefix="/munyiq-deprecated")

# No endpoints defined here - all functionality moved to munyiq_api module