-- Create the 'users' table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(255) CHECK (type IN ('CANDIDATE', 'RECRUITER', 'ADMIN')) NOT NULL
);

-- Create the 'companies' table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    office_locations VARCHAR(255)-- Array to store multiple office locations
);

-- Create the 'positions' table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    status VARCHAR(255) CHECK (status IN ('OPEN', 'EXPIRED')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INT REFERENCES companies(id),
    office_locations VARCHAR(255),
    external_application_link VARCHAR(255)
);

-- Insert sample users
INSERT INTO users (name, email, password, type) VALUES
('John Doe', 'john.doe@example.com', 'hashed_password', 'CANDIDATE'),
('Jane Smith', 'jane.smith@example.com', 'hashed_password', 'RECRUITER'),
('Admin User', 'admin@example.com', 'hashed_password', 'ADMIN');

-- Insert sample companies
INSERT INTO companies (name, description, website, office_locations) VALUES
('Acme Corp', 'A leading technology company', 'www.acmecorp.com', '{"New York", "San Francisco"}'),
('Globex Inc', 'A global logistics provider', 'www.globeinc.com', '{"London", "Tokyo", "Sydney"}'),
('Stark Industries', 'Innovating the future', 'www.starkindustries.com', '{"Los Angeles", "Chicago"}');

-- Insert sample positions
INSERT INTO positions (status, title, description, company_id, office_locations, external_application_link) VALUES
('OPEN', 'Software Engineer', 'Develop and maintain software applications', 1, '{"New York", "San Francisco"}', 'https://www.acmecorp.com/careers'),
('EXPIRED', 'Data Analyst', 'Analyze and interpret data', 1, '{"New York"}', 'https://www.acmecorp.com/careers'),
('OPEN', 'Logistics Coordinator', 'Coordinate logistics operations', 2, '{"London", "Tokyo"}', 'https://www.globeinc.com/jobs'),
('OPEN', 'Robotics Engineer', 'Design and build robots', 3, '{"Los Angeles"}', 'https://www.starkindustries.com/jobs');