-- Fix User Passwords
-- Updates all users to have the correct bcrypt hash for password123

UPDATE users SET password_hash = '$2b$10$NoAYTqBH7ojb5XUYeoe4w.mqEeCnccWbfEWQQ6erO67wJUpMwa1YS';

\echo 'Password hashes updated successfully!';
\echo 'All users now have password: password123';
