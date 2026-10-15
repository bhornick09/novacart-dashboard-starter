"""
connection.py — Database connection handler

Supports two backends:
  - Snowflake: primary database backend (SPCS deployment and production)
  - SQLite: automatic fallback for local development if Snowflake connection fails

The backend defaults to Snowflake and falls back to SQLite if the Snowflake connection fails.
When running inside SPCS, Snowflake automatically mounts an OAuth token
at /snowflake/session/token — no credentials needed in environment variables.
"""

import logging
import os
import sqlite3
import traceback
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [backend.connection] %(message)s",
)
logger = logging.getLogger("backend.connection")

try:
    import snowflake.connector  # pyright: ignore[reportMissingImports] # type: ignore
except ImportError:
    snowflake = None  # type: ignore

load_dotenv()

DATA_BACKEND = os.getenv("DATA_BACKEND", "snowflake")


# ── SQLite connection (local development) ─────────────────────────────────────

def get_sqlite_connection():
    """Returns a SQLite connection to the local Gold database."""
    db_path_env = os.getenv("SQLITE_PATH", "../data/novacart_gold.db")
    db_path = (Path(__file__).parent / db_path_env).resolve()
    logger.info("Attempting SQLite connection to: %s", db_path)
    if not db_path.exists():
        logger.error("SQLite database file not found at: %s", db_path)
        raise FileNotFoundError(
            f"SQLite database not found at {db_path}. "
            "Make sure novacart_gold.db is in the data/ folder."
        )
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row  # allows dict-like access to columns
    logger.info("SQLite connection established successfully.")
    return conn


# ── Snowflake connection ──────────────────────────────────────────────────────

def get_snowflake_connection():
    """
    Returns a Snowflake connection.

    When running inside SPCS: uses the OAuth token mounted at /snowflake/session/token.
    When running locally: uses keypair authentication from environment variables.
    """
    logger.info("Initiating Snowflake connection check...")
    if snowflake is None:
        logger.error("snowflake-connector-python is not installed in the environment.")
        raise ImportError(
            "snowflake-connector-python is required when DATA_BACKEND='snowflake'. "
            "Install it with: pip install snowflake-connector-python"
        )
    logger.info(
        "snowflake-connector-python is available (version: %s)",
        getattr(snowflake.connector, "__version__", "unknown"),
    )

    try:
        from cryptography.hazmat.primitives import serialization  # type: ignore
    except ImportError:
        logger.error("cryptography package is not installed. Install it with: pip install cryptography")
        raise

    token_path = Path("/snowflake/session/token")

    # SPCS mode — OAuth token mounted by the platform
    if token_path.exists():
        logger.info("Detected SPCS OAuth token at %s. Attempting SPCS OAuth connection.", token_path)
        account = os.getenv("SNOWFLAKE_ACCOUNT")
        host = os.getenv("SNOWFLAKE_HOST")
        database = os.getenv("SNOWFLAKE_DATABASE")
        schema = os.getenv("SNOWFLAKE_SCHEMA")
        warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")

        logger.info(
            "SPCS OAuth parameters: account=%s, host=%s, database=%s, schema=%s, warehouse=%s",
            account, host, database, schema, warehouse,
        )

        token = token_path.read_text("ascii").strip()
        conn = snowflake.connector.connect(
            account=account,
            host=host,
            authenticator="oauth",
            token=token,
            database=database,
            schema=schema,
            warehouse=warehouse,
        )
        logger.info("Successfully connected to Snowflake via SPCS OAuth.")
        return conn

    # Local mode — keypair authentication
    logger.info("SPCS OAuth token not found at %s. Attempting local keypair authentication.", token_path)

    account = os.getenv("SNOWFLAKE_ACCOUNT")
    user = os.getenv("SNOWFLAKE_USERNAME")
    role = os.getenv("SNOWFLAKE_ROLE")
    warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")
    database = os.getenv("SNOWFLAKE_DATABASE")
    schema = os.getenv("SNOWFLAKE_SCHEMA")
    private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
    private_key_raw = os.getenv("SNOWFLAKE_PRIVATE_KEY") or os.getenv("SNOWFLAKE_PRIVATE_KEY_RAW")

    logger.info(
        "Local Snowflake parameters: account=%s, user=%s, role=%s, warehouse=%s, database=%s, schema=%s, has_key_path=%s, has_key_env=%s",
        account, user, role, warehouse, database, schema, bool(private_key_path), bool(private_key_raw),
    )

    if private_key_raw:
        import base64
        logger.info("Loading private key from environment variable.")
        # Support base64-encoded string or standard PEM string with escaped newlines
        if "BEGIN" not in private_key_raw and not private_key_raw.startswith("-----"):
            key_data = base64.b64decode(private_key_raw)
        else:
            key_data = private_key_raw.replace("\\n", "\n").encode("utf-8")
        private_key = serialization.load_pem_private_key(key_data, password=None)
    elif private_key_path:
        resolved_key_path = Path(private_key_path)
        if not resolved_key_path.is_absolute():
            resolved_key_path = (Path(__file__).parent / private_key_path).resolve()

        if not resolved_key_path.exists():
            logger.error("Private key file does not exist at resolved path: %s", resolved_key_path)
            raise FileNotFoundError(
                f"Private key file not found at: {resolved_key_path}. "
                "Please check SNOWFLAKE_PRIVATE_KEY_PATH in your .env file."
            )

        logger.info("Loading private key from file: %s", resolved_key_path)
        with open(resolved_key_path, "rb") as key_file:
            private_key = serialization.load_pem_private_key(key_file.read(), password=None)
    else:
        logger.error("Neither SNOWFLAKE_PRIVATE_KEY_PATH nor SNOWFLAKE_PRIVATE_KEY is configured.")
        raise ValueError(
            "SNOWFLAKE_PRIVATE_KEY_PATH or SNOWFLAKE_PRIVATE_KEY is required for Snowflake connections. "
            "See .env.example for setup instructions."
        )

    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    logger.info("Connecting to Snowflake (account=%s, user=%s, warehouse=%s)...", account, user, warehouse)
    conn = snowflake.connector.connect(
        account=account,
        user=user,
        private_key=private_key_bytes,
        role=role,
        warehouse=warehouse,
        database=database,
        schema=schema,
    )
    logger.info("Successfully connected to Snowflake via local keypair authentication.")
    return conn


# ── Public interface ──────────────────────────────────────────────────────────

def get_connection():
    """
    Returns the appropriate database connection.
    Attempts Snowflake connection first, falling back to SQLite if Snowflake connection fails.

    Example:
        conn = get_connection()
        results = execute_query(conn, "SELECT * FROM fact_orders LIMIT 10")
    """
    if DATA_BACKEND == "sqlite":
        logger.info("DATA_BACKEND is set to 'sqlite'. Using SQLite connection directly.")
        return get_sqlite_connection()

    logger.info("Attempting Snowflake connection (DATA_BACKEND=%s)...", DATA_BACKEND)
    try:
        return get_snowflake_connection()
    except Exception as e:
        logger.error("Snowflake connection failed: %s\n%s", e, traceback.format_exc())
        logger.warning("Falling back to local SQLite database.")
        return get_sqlite_connection()


def execute_query(conn, query: str, params: tuple = ()) -> list[dict]:
    """
    Executes a query and returns results as a list of dicts.
    Works with both SQLite and Snowflake connections.

    Args:
        conn: database connection (SQLite or Snowflake)
        query: SQL query string
        params: query parameters (use ? for SQLite, %s for Snowflake)

    Returns:
        list of dicts, one per row
    """
    if isinstance(conn, sqlite3.Connection):
        sqlite_query = query.replace("%s", "?")
        cursor = conn.execute(sqlite_query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    else:
        if snowflake is None:
            raise ImportError("snowflake-connector-python is required for Snowflake queries.")
        cursor = conn.cursor(snowflake.connector.DictCursor)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.close()
        # Snowflake returns uppercase keys — normalize to lowercase
        return [{k.lower(): v for k, v in row.items()} for row in rows]
