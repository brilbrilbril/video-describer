from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    llama_server_url: str
    model_name: str
    api_key: str
    
    redis_host: str
    redis_port: int
    redis_db: int
    
    celery_redis_broker: str
    celery_redis_backend: str 
    
    class Config:
        env_file = ".env"
        
settings = Settings()