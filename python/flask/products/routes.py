from flask import Blueprint, request

products_bp = Blueprint("products", __name__)


@products_bp.route("/search")
def search():
    name = request.args.get("name", "guest")
    course = request.args.get("course", "unknown")
    return f" {name} is learning {course}"


@products_bp.route("/price/<int:id>")
def price(id):
    return f"User ID: {id}"