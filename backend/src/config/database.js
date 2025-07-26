const { Pool } = require('pg');

// Database connection pool
let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'imageflow',
      user: process.env.DB_USER || 'imageflow_app',
      password: process.env.DB_PASSWORD,
      max: 20, // maximum number of connections in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // how long to wait for a connection
    });

    // Test the connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    // Handle pool events
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
      process.exit(-1);
    });

  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

// Custom query builder for common operations
class QueryBuilder {
  constructor(tableName) {
    this.table = tableName;
    this.queryText = '';
    this.values = [];
    this.whereConditions = [];
    this.selectFields = ['*'];
    this.joinClauses = [];
    this.orderByClause = '';
    this.limitClause = '';
    this.offsetClause = '';
  }

  select(fields = ['*']) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  where(condition, value) {
    if (value !== undefined) {
      this.whereConditions.push(`${condition} = $${this.values.length + 1}`);
      this.values.push(value);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  whereIn(field, values) {
    if (values && values.length > 0) {
      const placeholders = values.map((_, index) => `$${this.values.length + index + 1}`);
      this.whereConditions.push(`${field} IN (${placeholders.join(', ')})`);
      this.values.push(...values);
    }
    return this;
  }

  join(table, condition) {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table, condition) {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByClause = `ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(count) {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  offset(count) {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  buildSelect() {
    const fields = this.selectFields.join(', ');
    let query = `SELECT ${fields} FROM ${this.table}`;
    
    if (this.joinClauses.length > 0) {
      query += ` ${this.joinClauses.join(' ')}`;
    }
    
    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }
    
    if (this.limitClause) {
      query += ` ${this.limitClause}`;
    }
    
    if (this.offsetClause) {
      query += ` ${this.offsetClause}`;
    }

    return { text: query, values: this.values };
  }

  buildInsert(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    
    return { text: query, values };
  }

  buildUpdate(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setPairs = fields.map((field, index) => `${field} = $${index + 1}`);

    let query = `UPDATE ${this.table} SET ${setPairs.join(', ')}`;
    
    if (this.whereConditions.length > 0) {
      // Adjust parameter indices for WHERE conditions
      const adjustedConditions = this.whereConditions.map(condition => {
        return condition.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + values.length}`);
      });
      query += ` WHERE ${adjustedConditions.join(' AND ')}`;
      values.push(...this.values);
    }
    
    query += ' RETURNING *';
    
    return { text: query, values };
  }

  buildDelete() {
    let query = `DELETE FROM ${this.table}`;
    
    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    return { text: query, values: this.values };
  }

  async execute() {
    const query = this.buildSelect();
    const result = await pool.query(query);
    return result.rows;
  }

  async insert(data) {
    const query = this.buildInsert(data);
    const result = await pool.query(query);
    return result.rows[0];
  }

  async update(data) {
    const query = this.buildUpdate(data);
    const result = await pool.query(query);
    return result.rows;
  }

  async delete() {
    const query = this.buildDelete();
    const result = await pool.query(query);
    return result.rowCount;
  }

  async first() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }
}

// Helper function to create query builder
const query = (tableName) => new QueryBuilder(tableName);

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Direct query execution
const executeQuery = async (text, params = []) => {
  const result = await pool.query(text, params);
  return result.rows;
};

const executeQuerySingle = async (text, params = []) => {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
};

module.exports = {
  connectDB,
  getPool,
  query,
  transaction,
  executeQuery,
  executeQuerySingle,
  QueryBuilder
};