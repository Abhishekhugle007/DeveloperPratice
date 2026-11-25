import math
import re

from bson import ObjectId
from flask import Blueprint, current_app, flash, abort, redirect, render_template, request, url_for
from pymongo.errors import DuplicateKeyError

from users.auth import login_required

students_bp = Blueprint("students", __name__, url_prefix="/students")


def get_students_collection():
    return current_app.extensions["mongo_db"]["students"]


def get_student(student_id):
    if not ObjectId.is_valid(student_id):
        abort(404)

    student = get_students_collection().find_one({"_id": ObjectId(student_id)})
    if student is None:
        abort(404)
    return student


def validate_student_form():
    form_data = {
        "name": request.form.get("name", "").strip(),
        "email": request.form.get("email", "").strip().lower(),
        "course": request.form.get("course", "").strip(),
    }
    errors = {}

    if len(form_data["name"]) < 2 or len(form_data["name"]) > 80:
        errors["name"] = "Name must be between 2 and 80 characters."

    if (
        len(form_data["email"]) > 254
        or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", form_data["email"])
    ):
        errors["email"] = "Enter a valid email address."

    if len(form_data["course"]) < 2 or len(form_data["course"]) > 80:
        errors["course"] = "Course must be between 2 and 80 characters."

    return form_data, errors


@students_bp.route("/", methods=["GET"])
@login_required
def list_students():
    collection = get_students_collection()
    search = request.args.get("q", "").strip()
    query = {}

    if search:
        safe_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}},
            {"course": {"$regex": safe_search, "$options": "i"}},
        ]

    try:
        page = max(1, int(request.args.get("page", "1")))
    except ValueError:
        page = 1

    per_page = 5
    total = collection.count_documents(query)
    total_pages = max(1, math.ceil(total / per_page))
    page = min(page, total_pages)
    students = list(
        collection.find(query)
        .sort("name", 1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    page_numbers = range(max(1, page - 2), min(total_pages, page + 2) + 1)

    return render_template(
        "students.html",
        students=students,
        search=search,
        page=page,
        total=total,
        total_pages=total_pages,
        page_numbers=page_numbers
    )


@students_bp.route("/new", methods=["GET", "POST"])
@login_required
def create_student():
    form_data = {"name": "", "email": "", "course": ""}
    errors = {}
    response_status = 400

    if request.method == "POST":
        form_data, errors = validate_student_form()
        if not errors:
            collection = get_students_collection()
            collection.create_index("email", unique=True)
            try:
                collection.insert_one(form_data)
            except DuplicateKeyError:
                errors["email"] = "A student with this email already exists."
                response_status = 409
            else:
                flash("Student added successfully.", "success")
                return redirect(url_for(".list_students"))

    return render_template(
        "student_form.html",
        form_data=form_data,
        errors=errors,
        heading="Add Student",
        button_text="Add Student",
        form_action=url_for(".create_student")
    ), response_status if errors else 200


@students_bp.route("/<student_id>/edit", methods=["GET", "POST"])
@login_required
def edit_student(student_id):
    student = get_student(student_id)
    form_data = {
        "name": student.get("name", ""),
        "email": student.get("email", ""),
        "course": student.get("course", ""),
    }
    errors = {}
    response_status = 400

    if request.method == "POST":
        form_data, errors = validate_student_form()
        if not errors:
            collection = get_students_collection()
            collection.create_index("email", unique=True)
            try:
                collection.update_one(
                    {"_id": student["_id"]},
                    {"$set": form_data}
                )
            except DuplicateKeyError:
                errors["email"] = "A student with this email already exists."
                response_status = 409
            else:
                flash("Student updated successfully.", "success")
                return redirect(url_for(".list_students"))

    return render_template(
        "student_form.html",
        form_data=form_data,
        errors=errors,
        heading="Edit Student",
        button_text="Save Changes",
        form_action=url_for(".edit_student", student_id=student_id)
    ), response_status if errors else 200


@students_bp.route("/<student_id>/delete", methods=["POST"])
@login_required
def delete_student(student_id):
    student = get_student(student_id)
    get_students_collection().delete_one({"_id": student["_id"]})
    flash("Student deleted.", "success")
    return redirect(url_for(".list_students"))
