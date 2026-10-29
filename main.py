from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware

client = MongoClient(
    "mongodb://127.0.0.1:27017",
    serverSelectionTimeoutMS=5000
)
client.admin.command("ping")
database = client["employee_db_kartik"]
employees_collection = database["employees"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()

app = FastAPI(title="Employee CRUD API Test", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Employee(BaseModel):
    name: str = Field(min_length=2)
    email: str
    department: str

def serialize_employee(employee):
    employee["id"] = str(employee.pop("_id"))
    return employee

def get_employee_or_404(employee_id: str):
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(404, "Employee not found")
    employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )
    if employee is None:
        raise HTTPException(404, "Employee not found")
    return employee


@app.post("/employees", status_code=201)
def create_employee(employee: Employee):
    employee_data = employee.model_dump()
    result = employees_collection.insert_one(employee_data)
    saved_employee = employees_collection.find_one({"_id": result.inserted_id})
    return serialize_employee(saved_employee)

@app.get("/employees")
def get_employees():
    employees = employees_collection.find()
    return [serialize_employee(employee) for employee in employees]

@app.get("/employees/{employee_id}")
def get_employee(employee_id: str):
    employee = get_employee_or_404(employee_id)
    return serialize_employee(employee)

@app.put("/employees/{employee_id}")
def update_employee(
    employee_id: str,
    employee: Employee
):
    get_employee_or_404(employee_id)
    employees_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": employee.model_dump()}
    )
    updated_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )
    return serialize_employee(updated_employee)
@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: str):
    employee = get_employee_or_404(employee_id)

    employees_collection.delete_one(
        {"_id": ObjectId(employee_id)}
    )
    return {
        "message": "Employee deleted successfully",
        "employee": serialize_employee(employee)
    }