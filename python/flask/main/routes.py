import os
import re
import secrets

from flask import Blueprint, current_app, flash, redirect, request, render_template, session, url_for
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

main_bp = Blueprint("main", __name__)

ALLOWED_UPLOAD_EXTENSIONS = {"gif", "jpg", "jpeg", "png", "pdf", "txt"}


@main_bp.route("/")
def home():
    name = request.args.get("name", "Guest")
    role = request.args.get("role", "user").lower()
    courses = ["Python", "Flask", "HTML", "CSS"]
    return render_template("index.html", name=name, role=role, courses=courses)


@main_bp.route("/about")
def about():
    return render_template("about.html")


@main_bp.route("/contact", methods=["GET", "POST"])
def contact():
    form_data = {"name": "", "age": "", "email": "", "message": ""}
    errors = {}

    if request.method == "POST":
        form_data = {
            "name": request.form.get("name", "").strip(),
            "age": request.form.get("age", "").strip(),
            "email": request.form.get("email", "").strip(),
            "message": request.form.get("message", "").strip(),
        }

        if len(form_data["name"]) < 2:
            errors["name"] = "Name must be at least 2 characters."
        elif len(form_data["name"]) > 80:
            errors["name"] = "Name must be 80 characters or fewer."

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

        if len(form_data["message"]) < 10:
            errors["message"] = "Message must be at least 10 characters."
        elif len(form_data["message"]) > 1000:
            errors["message"] = "Message must be 1000 characters or fewer."

        if errors:
            flash("Please fix the errors below and try again.", "error")
            return render_template(
                "contact.html",
                errors=errors,
                form_data=form_data
            ), 400

        users_collection = current_app.extensions["mongo_db"]["users"]
        users_collection.update_one(
            {"email": form_data["email"]},
            {
                "$set": {
                    "name": form_data["name"],
                    "age": age,
                    "email": form_data["email"],
                    "message": form_data["message"],
                }
            },
            upsert=True
        )

        flash("Thank you! Your message has been received.", "success")
        return redirect(url_for(".contact"))

    return render_template(
        "contact.html",
        errors=errors,
        form_data=form_data,
    )


@main_bp.route("/storage", methods=["GET", "POST"])
def storage():
    if request.method == "POST":
        action = request.form.get("action")
        username = request.form.get("username", "").strip()

        if action in ("set_session", "set_cookie") and not username:
            flash("Enter a name first.", "error")
        elif action == "set_session":
            session["username"] = username
            flash("Name saved in the session.", "success")
        elif action == "set_cookie":
            response = redirect(url_for(".storage"))
            response.set_cookie(
                "username",
                username,
                max_age=3600,
                httponly=True,
                samesite="Lax"
            )
            flash("Name saved in a cookie for one hour.", "success")
            return response
        elif action == "clear_session":
            session.pop("username", None)
            flash("Session name cleared.", "success")
        elif action == "clear_cookie":
            response = redirect(url_for(".storage"))
            response.delete_cookie("username")
            flash("Cookie name cleared.", "success")
            return response
        else:
            flash("Choose a valid action.", "error")

        return redirect(url_for(".storage"))

    return render_template(
        "storage.html",
        session_username=session.get("username"),
        cookie_username=request.cookies.get("username")
    )


@main_bp.route("/upload", methods=["POST"])
def upload_file():
    try:
        uploaded_file = request.files.get("file")
    except RequestEntityTooLarge:
        flash("File is too large. The maximum size is 5 MB.", "error")
        return redirect(url_for(".storage"))

    if uploaded_file is None or not uploaded_file.filename:
        flash("Choose a file to upload.", "error")
        return redirect(url_for(".storage"))

    original_filename = secure_filename(uploaded_file.filename)
    if not original_filename:
        flash("The file name is not valid.", "error")
        return redirect(url_for(".storage"))

    extension = os.path.splitext(original_filename)[1].lower().lstrip(".")
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        flash("Choose a PNG, JPG, GIF, PDF, or TXT file.", "error")
        return redirect(url_for(".storage"))

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    saved_filename = f"{secrets.token_hex(16)}.{extension}"
    saved_path = os.path.join(upload_folder, saved_filename)
    uploaded_file.save(saved_path)

    flash(f"{original_filename} was saved successfully.", "success")
    return redirect(url_for(".storage"))
