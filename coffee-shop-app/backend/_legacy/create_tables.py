"""Create database tables for the Cashier System using SQLAlchemy.
Reads DATABASE_URL from environment or .env.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise SystemExit('Set DATABASE_URL environment variable (see .env.example)')

Base = declarative_base()


class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    sku = Column(String, unique=True)
    name = Column(Text, nullable=False)
    price = Column(Numeric(10,2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    table_no = Column(String)
    total = Column(Numeric(10,2), default=0)
    status = Column(String, default='open')
    created_at = Column(DateTime, server_default=func.now())
    paid_at = Column(DateTime)
    items = relationship('OrderItem', back_populates='order')


class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'))
    product_id = Column(Integer, ForeignKey('products.id'))
    qty = Column(Integer, default=1)
    price = Column(Numeric(10,2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    order = relationship('Order', back_populates='items')


class DisplayMessage(Base):
    __tablename__ = 'display_messages'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer)
    destination = Column(String, nullable=False)
    payload = Column(JSONB, nullable=False)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    sent_at = Column(DateTime)


def main():
    engine = create_engine(DATABASE_URL)
    print('Connecting to database and creating tables...')
    Base.metadata.create_all(engine)
    print('Tables created (if they did not exist).')


if __name__ == '__main__':
    main()
