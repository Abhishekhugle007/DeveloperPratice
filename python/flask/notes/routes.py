import re
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, abort, current_app, flash, redirect, render_template, request, session, url_for

from users.auth import login_required

notes_bp = Blueprint("notes", __name__, url_prefix="/notes")


def get_notes_collection():
    return current_app.extensions["mongo_db"]["notes"]


def get_owned_note(note_id):
    if not ObjectId.is_valid(note_id):
        abort(404)

    collection = get_notes_collection()
    note = collection.find_one({
        "_id": ObjectId(note_id),
        "owner_id": session["user_id"]
    })
    if note is None:
        abort(404)
    return collection, note


def validate_note_form():
    form_data = {
        "title": request.form.get("title", "").strip(),
        "content": request.form.get("content", "").strip(),
    }
    errors = {}

    if not form_data["title"] or len(form_data["title"]) > 120:
        errors["title"] = "Title is required and must be 120 characters or fewer."
    if len(form_data["content"]) > 10000:
        errors["content"] = "Note content must be 10,000 characters or fewer."

    return form_data, errors


@notes_bp.route("/", methods=["GET"])
@login_required
def list_notes():
    search = request.args.get("q", "").strip()
    query = {"owner_id": session["user_id"]}

    if search:
        safe_search = re.escape(search)
        query["$and"] = [
            {"owner_id": session["user_id"]},
            {
                "$or": [
                    {"title": {"$regex": safe_search, "$options": "i"}},
                    {"content": {"$regex": safe_search, "$options": "i"}},
                ]
            },
        ]

    notes = list(
        get_notes_collection().find(query)
        .sort("updated_at", -1)
        .limit(100)
    )
    return render_template("notes.html", notes=notes, search=search)


@notes_bp.route("/new", methods=["GET", "POST"])
@login_required
def create_note():
    form_data = {"title": "", "content": ""}
    errors = {}

    if request.method == "POST":
        form_data, errors = validate_note_form()
        if not errors:
            now = datetime.now(timezone.utc)
            get_notes_collection().insert_one({
                "owner_id": session["user_id"],
                "title": form_data["title"],
                "content": form_data["content"],
                "created_at": now,
                "updated_at": now,
            })
            flash("Note created.", "success")
            return redirect(url_for(".list_notes"))

    return render_template(
        "note_form.html",
        form_data=form_data,
        errors=errors,
        heading="New Note",
        button_text="Save Note",
        form_action=url_for(".create_note")
    ), 400 if errors else 200


@notes_bp.route("/<note_id>/edit", methods=["GET", "POST"])
@login_required
def edit_note(note_id):
    collection, note = get_owned_note(note_id)
    form_data = {
        "title": note.get("title", ""),
        "content": note.get("content", ""),
    }
    errors = {}

    if request.method == "POST":
        form_data, errors = validate_note_form()
        if not errors:
            collection.update_one(
                {"_id": note["_id"], "owner_id": session["user_id"]},
                {
                    "$set": {
                        **form_data,
                        "updated_at": datetime.now(timezone.utc),
                    }
                }
            )
            flash("Note updated.", "success")
            return redirect(url_for(".list_notes"))

    return render_template(
        "note_form.html",
        form_data=form_data,
        errors=errors,
        heading="Edit Note",
        button_text="Save Changes",
        form_action=url_for(".edit_note", note_id=note_id)
    ), 400 if errors else 200


@notes_bp.route("/<note_id>/delete", methods=["POST"])
@login_required
def delete_note(note_id):
    collection, note = get_owned_note(note_id)
    collection.delete_one({
        "_id": note["_id"],
        "owner_id": session["user_id"]
    })
    flash("Note deleted.", "success")
    return redirect(url_for(".list_notes"))
