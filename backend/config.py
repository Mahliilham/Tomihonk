import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://mahli:mahli123@cluster1.bv983sn.mongodb.net/?appName=Cluster1")
DB_NAME = os.getenv("DB_NAME", "tomihonk")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
FONNTE_TOKEN = os.getenv("FONNTE_TOKEN", "9DtZXWXj9BQHQUFqVrw3")

import certifi

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
db = client[DB_NAME]