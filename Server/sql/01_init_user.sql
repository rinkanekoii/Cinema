-- =============================================
-- CINEMA HUB - 01. Initialize User and Tablespace
-- Run as SYS or SYSTEM user
-- =============================================

ALTER SESSION SET "_ORACLE_SCRIPT"=true;
SET SERVEROUTPUT ON;
SET DEFINE OFF;

-- Clean up existing objects
BEGIN
    -- Kill existing sessions
    FOR r IN (SELECT sid, serial# FROM v$session WHERE username = 'CINEMA_DB') LOOP
        BEGIN
            EXECUTE IMMEDIATE 'ALTER SYSTEM KILL SESSION ''' || r.sid || ',' || r.serial# || ''' IMMEDIATE';
            DBMS_OUTPUT.PUT_LINE('Killed session: ' || r.sid);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;
    
    -- Drop existing user
    BEGIN 
        EXECUTE IMMEDIATE 'DROP USER CINEMA_DB CASCADE'; 
        DBMS_OUTPUT.PUT_LINE('Dropped user CINEMA_DB');
    EXCEPTION WHEN OTHERS THEN 
        DBMS_OUTPUT.PUT_LINE('User CINEMA_DB does not exist');
    END;
    
    -- Drop existing tablespace
    BEGIN 
        EXECUTE IMMEDIATE 'DROP TABLESPACE CINEMA_TBS INCLUDING CONTENTS AND DATAFILES'; 
        DBMS_OUTPUT.PUT_LINE('Dropped tablespace CINEMA_TBS');
    EXCEPTION WHEN OTHERS THEN 
        DBMS_OUTPUT.PUT_LINE('Tablespace CINEMA_TBS does not exist');
    END;
END;
/

-- Create Tablespace
CREATE TABLESPACE CINEMA_TBS
DATAFILE 'cinema_tbs01.dbf' SIZE 500M REUSE AUTOEXTEND ON NEXT 100M MAXSIZE 2G
EXTENT MANAGEMENT LOCAL SEGMENT SPACE MANAGEMENT AUTO;

-- Create User
CREATE USER CINEMA_DB IDENTIFIED BY cinema123 
DEFAULT TABLESPACE CINEMA_TBS 
TEMPORARY TABLESPACE temp
QUOTA UNLIMITED ON CINEMA_TBS;

-- Create Password Profile (drop if exists)
BEGIN
    EXECUTE IMMEDIATE 'DROP PROFILE cinema_profile CASCADE';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

CREATE PROFILE cinema_profile LIMIT 
    FAILED_LOGIN_ATTEMPTS 5
    PASSWORD_LIFE_TIME 90
    PASSWORD_GRACE_TIME 7
    PASSWORD_REUSE_TIME 365
    SESSIONS_PER_USER 10
    IDLE_TIME 60
    CONNECT_TIME UNLIMITED;

ALTER USER CINEMA_DB PROFILE cinema_profile;

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== User CINEMA_DB created successfully ===');
    DBMS_OUTPUT.PUT_LINE('Password: cinema123');
    DBMS_OUTPUT.PUT_LINE('Tablespace: CINEMA_TBS');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Next: Run 02_grants.sql as SYS/SYSTEM');
END;
/
