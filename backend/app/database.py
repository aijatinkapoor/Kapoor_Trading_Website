import os

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Supabase service role key is missing")


# Normal client for database operations
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# Admin client for protected server-side operations
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)