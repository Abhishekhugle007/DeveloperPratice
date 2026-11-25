import os
import secrets
from dotenv import load_dotenv
from flask import Flask, render_template
from pymongo import MongoClient

from extensions import db
from main import main_bp
from notes import notes_bp
from products import products_bp
from students import students_bp
from todos import todos_bp
from users import users_bp
from users.models import User

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)

mongo_client = MongoClient("mongodb://localhost:27017")
mongo_db = mongo_client["flask_db"]
users_collection = mongo_db["users"]
app.extensions["mongo_db"] = mongo_db
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["APP_NAME"] = os.getenv("APP_NAME", "Flask Practice")
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32)
app.config["UPLOAD_FOLDER"] = os.path.join(app.instance_path, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
db.init_app(app)

@app.context_processor
def inject_app_name():
    return {"app_name": app.config["APP_NAME"]}

@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404

@app.errorhandler(500)
def internal_server_error(error):
    return render_template("500.html"), 500

app.register_blueprint(main_bp)
app.register_blueprint(notes_bp)
app.register_blueprint(users_bp)
app.register_blueprint(products_bp)
app.register_blueprint(todos_bp)
app.register_blueprint(students_bp)



if __name__ == "__main__":
    with app.app_context():
        db.create_all()

        user = User.query.filter_by(email="mohit@gmail.com").first()
        if user is None:
            user = User(
                name="Mohit",
                email="mohit@gmail.com",
                age=30
            )
            db.session.add(user)
            db.session.commit()
            print("User created successfully.")

        users_collection.update_one(
            {"email": "mohit@gmail.com"},
            {
                "$setOnInsert": {
                    "name": "Mohit",
                    "email": "mohit@gmail.com",
                    "age": 30
                }
            },
            upsert=True
        )

    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")