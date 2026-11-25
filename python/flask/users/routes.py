import re

from flask import Blueprint, current_app, flash, redirect, render_template, request, session, url_for
from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash, generate_password_hash

from .auth import login_required

users_bp = Blueprint("users", __name__)


@users_bp.route("/register", methods=["GET", "POST"])
def register():
    form_data = {"name": "", "age": "", "email": ""}
    errors = {}
    response_status = 400

    if request.method == "POST":
        form_data = {
            "name": request.form.get("name", "").strip(),
            "age": request.form.get("age", "").strip(),
            "email": request.form.get("email", "").strip().lower(),
        }
        password = request.form.get("password", "")

        if len(form_data["name"]) < 2 or len(form_data["name"]) > 80:
            errors["name"] = "Name must be between 2 and 80 characters."

        try:
            age = int(form_data["age"])
            if age < 1 or age > 120:
                errors["age"] = "Age must be between 1 and 120."
        except ValueError:
            errors["age"] = "Enter your age as a whole number."

        if (
            len(form_data["email"]) > 254
            or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", form_data["email"])
        ):
            errors["email"] = "Enter a valid email address."

        if len(password) < 8 or len(password) > 128:
            errors["password"] = "Password must be between 8 and 128 characters."

        if not errors:
            users_collection = current_app.extensions["mongo_db"]["users"]
            users_collection.create_index("email", unique=True)
            user_document = {
                "name": form_data["name"],
                "age": age,
                "email": form_data["email"],
                "password_hash": generate_password_hash(password),
            }

            try:
                result = users_collection.update_one(
                    {"email": form_data["email"]},
                    {"$setOnInsert": user_document},
                    upsert=True
                )
            except DuplicateKeyError:
                result = None

            if result is None or result.upserted_id is None:
                errors["email"] = "An account with this email already exists."
                response_status = 409
            else:
                flash("Your account was created successfully.", "success")
                return redirect(url_for(".login"))

    return render_template(
        "register.html",
        form_data=form_data,
        errors=errors
    ), response_status if errors else 200


@users_bp.route("/login", methods=["GET", "POST"])
def login():
    email = ""
    error = None

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        users_collection = current_app.extensions["mongo_db"]["users"]
        user = users_collection.find_one({"email": email})

        if (
            user
            and user.get("password_hash")
            and check_password_hash(user["password_hash"], password)
        ):
            session.clear()
            session["user_id"] = str(user["_id"])
            session["user_name"] = user["name"]
            flash("You are now logged in.", "success")
            return redirect(url_for("main.home"))

        error = "Invalid email or password."

    return render_template("login.html", email=email, error=error), 401 if error else 200


@users_bp.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", user_name=session.get("user_name"))


@users_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for(".login"))


@users_bp.route("/users")
@login_required
def users():
    term = request.args.get("term", "").strip()
    min_age_text = request.args.get("min_age", "").strip()
    max_age_text = request.args.get("max_age", "").strip()
    errors = {}
    age_filter = {}

    for field, value, operator in (
        ("min_age", min_age_text, "$gte"),
        ("max_age", max_age_text, "$lte"),
    ):
        if value:
            try:
                age = int(value)
                if age < 1 or age > 120:
                    errors[field] = "Age must be between 1 and 120."
                else:
                    age_filter[operator] = age
            except ValueError:
                errors[field] = "Enter a whole number."

    if (
        min_age_text
        and max_age_text
        and "min_age" not in errors
        and "max_age" not in errors
        and age_filter["$gte"] > age_filter["$lte"]
    ):
        errors["max_age"] = "Maximum age must be at least the minimum age."

    query = {}
    if term:
        safe_term = re.escape(term)
        query["$or"] = [
            {"name": {"$regex": safe_term, "$options": "i"}},
            {"email": {"$regex": safe_term, "$options": "i"}},
        ]
    if age_filter:
        query["age"] = age_filter

    users = []
    if not errors:
        users_collection = current_app.extensions["mongo_db"]["users"]
        users = list(
            users_collection.find(query, {"_id": 0})
            .sort("name", 1)
            .limit(100)
        )

    return render_template(
        "users.html",
        users=users,
        term=term,
        min_age=min_age_text,
        max_age=max_age_text,
        errors=errors
    ), 400 if errors else 200


@users_bp.route("/user/<name>")
def user(name):
    return f"Welcome {name}"


@users_bp.route("/student/<uuid:user_id>")
def student(user_id):
    return str(user_id)