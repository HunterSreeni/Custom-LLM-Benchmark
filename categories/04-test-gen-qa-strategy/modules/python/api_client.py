"""Lightweight API client with retry logic and rate-limit handling."""

import time
import random
from typing import Any, Optional


class ApiError(Exception):
    """Raised when an API request fails after all retries are exhausted."""

    def __init__(self, status_code: int, message: str, retries_attempted: int = 0):
        self.status_code = status_code
        self.message = message
        self.retries_attempted = retries_attempted
        super().__init__(f"HTTP {status_code}: {message} (after {retries_attempted} retries)")


class ApiClient:
    """HTTP client with exponential backoff retry and rate-limit awareness."""

    MAX_RETRIES = 3
    BASE_DELAY = 0.5  # seconds
    RETRYABLE_STATUS_CODES = {500, 502, 503, 504, 429}

    def __init__(self, base_url: str, timeout: float = 30.0, session: Any = None):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session = session  # injected HTTP session (e.g. requests.Session)

    # --- public methods ---

    def get(self, path: str, params: Optional[dict] = None) -> dict:
        """Send a GET request with automatic retry."""
        return self._request("GET", path, params=params)

    def post(self, path: str, json: Optional[dict] = None) -> dict:
        """Send a POST request with automatic retry."""
        return self._request("POST", path, json=json)

    def delete(self, path: str) -> dict:
        """Send a DELETE request with automatic retry."""
        return self._request("DELETE", path)

    # --- internal helpers ---

    @staticmethod
    def _calculate_backoff(attempt: int, base_delay: float = 0.5) -> float:
        """Return exponential backoff delay with jitter for the given attempt (0-indexed).

        Formula: base_delay * 2^attempt + random jitter in [0, base_delay)
        """
        delay = base_delay * (2 ** attempt)
        jitter = random.random() * base_delay
        return delay + jitter

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.base_url}/{path.lstrip('/')}"

        last_error: Optional[Exception] = None

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                response = self._session.request(
                    method, url, timeout=self.timeout, **kwargs
                )

                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    wait = float(retry_after) if retry_after else self._calculate_backoff(attempt, self.BASE_DELAY)
                    time.sleep(wait)
                    continue

                if response.status_code >= 400:
                    if response.status_code in self.RETRYABLE_STATUS_CODES and attempt < self.MAX_RETRIES:
                        time.sleep(self._calculate_backoff(attempt, self.BASE_DELAY))
                        continue
                    raise ApiError(response.status_code, response.text, retries_attempted=attempt)

                return response.json()

            except ApiError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < self.MAX_RETRIES:
                    time.sleep(self._calculate_backoff(attempt, self.BASE_DELAY))
                    continue

        raise ApiError(0, f"Request failed: {last_error}", retries_attempted=self.MAX_RETRIES)
