from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import language_tool_python

from database import SessionLocal, engine, Base
from auth import create_user, authenticate_user
from ai_model import improve_text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

tool = language_tool_python.LanguageTool("en-US")


class TextInput(BaseModel):
    text: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "AI AutoCorrect API Running"
    }


@app.post("/correct")
def correct_text(data: TextInput):
    matches = tool.check(data.text)

    suggestions = []
    for match in matches:
        suggestions.extend(match.replacements)

    corrected_text = language_tool_python.utils.correct(
        data.text,
        matches
    )

    return {
        "original": data.text,
        "corrected": corrected_text,
        "suggestions": list(dict.fromkeys(suggestions))
    }


@app.post("/ai-correct")
def ai_correct(data: TextInput):
    improved = improve_text(data.text)

    return {
        "original": data.text,
        "improved": improved
    }


@app.post("/improve")
def improve(data: TextInput):
    improved = (
        data.text
        .replace("can't", "cannot")
        .replace("don't", "do not")
    )

    return {
        "original": data.text,
        "improved": improved
    }


@app.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    user = create_user(
        db,
        data.username,
        data.email,
        data.password
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    return {
        "message": "User registered successfully",
        "username": user.username
    }


@app.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db,
        data.username,
        data.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "message": "Login successful",
        "username": user.username,
        "email": user.email
    }







