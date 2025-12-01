-- Make brand column optional in vehicles table
ALTER TABLE vehicles ALTER COLUMN brand DROP NOT NULL;
