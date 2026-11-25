from functools import wraps

from flask import flash, redirect, session, url_for


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if not session.get("user_id"):
            flash("Please log in to view that page.", "error")
            return redirect(url_for("users.login"))
        return view(*args, **kwargs)

    return wrapped_view
