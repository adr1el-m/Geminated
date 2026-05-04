import requests
import os

def get_region_from_ip(ip: str) -> str:
    """
    Get coarse geolocation (province/region) from IP address.
    Uses ipapi.co free tier.
    """
    if not ip or ip in ["127.0.0.1", "localhost", "0.0.0.0"]:
        return "Metro Manila" # Default for local dev
    
    try:
        response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get("region", "Unknown Region")
    except Exception:
        pass
    
    return "Unknown Region"
