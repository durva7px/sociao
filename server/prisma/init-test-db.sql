-- Runs once when the Postgres container is first created.
-- Creates a separate database for the test suite so tests never touch dev data.
CREATE DATABASE sociao_test;
