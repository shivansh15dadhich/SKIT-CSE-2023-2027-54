from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_to_mongodb(uri: str, database_name: str) -> None:
    global client, db

    client = AsyncIOMotorClient(uri)

    await client.admin.command("ping")

    db = client[database_name]

    await db.users.create_index("email", unique=True)
    await db.assessments.create_index([("user_id", 1), ("created_at", -1)])
    await db.trends.create_index([("user_id", 1), ("created_at", -1)])


async def close_mongodb() -> None:
    global client, db

    if client is not None:
        client.close()

    client = None
    db = None


def get_database() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("MongoDB connection has not been initialized.")

    return db