const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbTypeClob = oracledb.DB_TYPE_CLOB || oracledb.CLOB;
const dbTypeNclob = oracledb.DB_TYPE_NCLOB || oracledb.NCLOB;
oracledb.fetchAsString = [dbTypeClob, dbTypeNclob].filter(Boolean);

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 2,
    poolTimeout: 60
};

let pool;

async function initialize() {
    try {
        pool = await oracledb.createPool(dbConfig);
        console.log('✅ Oracle Database connection pool created successfully');
    } catch (err) {
        console.error('❌ Error creating connection pool:', err);
        throw err;
    }
}

async function close() {
    try {
        await pool.close(10);
        console.log('Connection pool closed');
    } catch (err) {
        console.error('Error closing connection pool:', err);
    }
}

function getPool() {
    return pool;
}

async function execute(sql, binds = [], options = {}) {
    let connection;
    try {
        connection = await pool.getConnection();
        const result = await connection.execute(sql, binds, options);
        return {
            rows: result.rows || [],
            rowsAffected: result.rowsAffected,
            outBinds: result.outBinds,
            metaData: result.metaData
        };
    } catch (err) {
        console.error('Database execution error:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    initialize,
    close,
    getPool,
    execute
};
