CREATE DATABASE IF NOT EXISTS offline_db;

CREATE USER IF NOT EXISTS 'offline_user'@'%' IDENTIFIED BY 'offline_password';
GRANT ALL PRIVILEGES ON offline_db.* TO 'offline_user'@'%';
FLUSH PRIVILEGES;
