-- Queries for User (Citizen) profile management requested by user

-- 1. Create User Profile (After Initial Firebase Login Onboarding)
-- Note: User provides Fname, Lname, Street, ZipCode, Phone. Email comes from Firebase.
INSERT INTO CITIZEN (Fname, Lname, Street, ZipCode, Phone, Email)
VALUES (%s, %s, %s, %s, %s, %s)
RETURNING Citizen_ID;

-- 2. Read User Profile (To check if user exists on login, matching by Email)
SELECT * FROM CITIZEN WHERE Email = %s;

-- 3. Update User Profile (e.g., in the Navbar 'Edit Profile' section)
UPDATE CITIZEN
SET Fname = %s, Lname = %s, Street = %s, ZipCode = %s, Phone = %s
WHERE Email = %s;

-- 4. Delete User Profile (If user wants to delete their account)
DELETE FROM CITIZEN WHERE Email = %s;
