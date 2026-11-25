from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, abort, current_app, flash, redirect, render_template, request, session, url_for

from users.auth import login_required

todos_bp = Blueprint("todos", __name__, url_prefix="/todos")


def get_owned_todo(todo_id):
    if not ObjectId.is_valid(todo_id):
        abort(404)

    collection = current_app.extensions["mongo_db"]["todos"]
    todo = collection.find_one({
        "_id": ObjectId(todo_id),
        "owner_id": session["user_id"]
    })
    if todo is None:
        abort(404)

    return collection, todo


@todos_bp.route("/", methods=["GET", "POST"])
@login_required
def list_todos():
    collection = current_app.extensions["mongo_db"]["todos"]
    form_data = {"title": "", "description": ""}
    error = None

    if request.method == "POST":
        form_data = {
            "title": request.form.get("title", "").strip(),
            "description": request.form.get("description", "").strip(),
        }

        if not form_data["title"] or len(form_data["title"]) > 120:
            error = "Title is required and must be 120 characters or fewer."
        elif len(form_data["description"]) > 500:
            error = "Description must be 500 characters or fewer."

        if error:
            todos = list(
                collection.find({"owner_id": session["user_id"]})
                .sort("created_at", -1)
            )
            return render_template(
                "todos.html",
                todos=todos,
                form_data=form_data,
                error=error
            ), 400

        collection.insert_one({
            "owner_id": session["user_id"],
            "title": form_data["title"],
            "description": form_data["description"],
            "completed": False,
            "created_at": datetime.now(timezone.utc),
        })
        flash("Todo added.", "success")
        return redirect(url_for(".list_todos"))

    todos = list(
        collection.find({"owner_id": session["user_id"]})
        .sort("created_at", -1)
    )
    return render_template(
        "todos.html",
        todos=todos,
        form_data=form_data,
        error=error
    )


@todos_bp.route("/<todo_id>/edit", methods=["GET", "POST"])
@login_required
def edit_todo(todo_id):
    collection, todo = get_owned_todo(todo_id)
    form_data = {
        "title": todo.get("title", ""),
        "description": todo.get("description", ""),
    }
    error = None

    if request.method == "POST":
        form_data = {
            "title": request.form.get("title", "").strip(),
            "description": request.form.get("description", "").strip(),
        }

        if not form_data["title"] or len(form_data["title"]) > 120:
            error = "Title is required and must be 120 characters or fewer."
        elif len(form_data["description"]) > 500:
            error = "Description must be 500 characters or fewer."

        if error:
            return render_template(
                "edit_todo.html",
                form_data=form_data,
                error=error
            ), 400

        collection.update_one(
            {"_id": todo["_id"], "owner_id": session["user_id"]},
            {"$set": form_data}
        )
        flash("Todo updated.", "success")
        return redirect(url_for(".list_todos"))

    return render_template("edit_todo.html", form_data=form_data, error=error)


@todos_bp.route("/<todo_id>/toggle", methods=["POST"])
@login_required
def toggle_todo(todo_id):
    collection, todo = get_owned_todo(todo_id)
    collection.update_one(
        {"_id": todo["_id"], "owner_id": session["user_id"]},
        {"$set": {"completed": not todo.get("completed", False)}}
    )
    flash("Todo status updated.", "success")
    return redirect(url_for(".list_todos"))


@todos_bp.route("/<todo_id>/delete", methods=["POST"])
@login_required
def delete_todo(todo_id):
    collection, todo = get_owned_todo(todo_id)
    collection.delete_one({
        "_id": todo["_id"],
        "owner_id": session["user_id"]
    })
    flash("Todo deleted.", "success")
    return redirect(url_for(".list_todos"))
