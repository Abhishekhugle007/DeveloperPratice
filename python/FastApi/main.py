from typing import Annotated

from fastapi import FastAPI, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, Field

app = FastAPI()


class Dimensions(BaseModel):
    length: float = Field(gt=0)
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class Item(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    price: float = Field(gt=0)
    dimensions: Dimensions | None = None


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class TodoUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    completed: bool


class Todo(TodoCreate):
    id: int
    completed: bool = False


todo_store: dict[int, Todo] = {}
next_todo_id = 1


#Home Route
@app.get("/")
def home():
    return {"message": "Hello World"}


#About Route

@app.get("/user")
def about():
    return {"user": {"message": "Hello World", "name": "Abhi"}}


@app.get("/users/{user_id}")
def get_user(user_id: Annotated[int, Path(ge=1, le=1000)]):
    return {"user_id": user_id, "message": f"User {user_id}"} 


@app.get("/items")
def list_items(
    q: Annotated[str | None, Query()] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return {"q": q, "skip": skip, "limit": limit}


@app.post("/items")
def create_item(item: Item):
    return {"message": "Item created", "item": item}


@app.post("/todos", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoCreate):
    global next_todo_id
    created_todo = Todo(id=next_todo_id, **todo.model_dump())
    todo_store[created_todo.id] = created_todo
    next_todo_id += 1
    return created_todo


@app.get("/todos", response_model=list[Todo])
def list_todos():
    return list(todo_store.values())


@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: Annotated[int, Path(ge=1)]):
    todo = todo_store.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo


@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: Annotated[int, Path(ge=1)], todo_update: TodoUpdate):
    if todo_id not in todo_store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    updated_todo = Todo(id=todo_id, **todo_update.model_dump())
    todo_store[todo_id] = updated_todo
    return updated_todo


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: Annotated[int, Path(ge=1)]):
    if todo_id not in todo_store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    del todo_store[todo_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)