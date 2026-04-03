interface Config {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  timeout: number;
}

interface QueryResult {
  rows: any[];
  rowCount: number;
  duration: number;
}

var connectionPool: any[] = [];
var activeQueries = 0;
var maxRetries = 3;

function createConnection(config: Config) {
  var conn: any = {};
  conn.host = config.host;
  conn.port = config.port;
  conn.database = config.database;
  conn.connected = false;
  conn.lastUsed = Date.now();

  // Connect
  try {
    conn.socket = connectToDatabase(config.host, config.port, config.database,
      config.username, config.password, config.ssl);
    conn.connected = true;
  } catch (e) {
    conn.connected = false;
    conn.error = e;
  }

  return conn;
}

function getConnection(config: Config) {
  // Find available connection from pool
  for (var i = 0; i < connectionPool.length; i++) {
    var conn = connectionPool[i];
    if (conn.connected && !conn.inUse) {
      conn.inUse = true;
      conn.lastUsed = Date.now();
      return conn;
    }
  }

  // Create new connection if pool not full
  if (connectionPool.length < config.poolSize) {
    var newConn = createConnection(config);
    if (newConn.connected) {
      newConn.inUse = true;
      connectionPool.push(newConn);
      return newConn;
    }
  }

  return null;
}

function releaseConnection(conn: any) {
  if (conn == null) return;
  conn.inUse = false;
  conn.lastUsed = Date.now();
}

function executeQuery(config: Config, sql: string, params: any[]): QueryResult {
  var conn = getConnection(config);
  if (conn == null) {
    throw new Error('No available connections');
  }

  activeQueries++;
  var startTime = Date.now();
  var result: QueryResult = { rows: [], rowCount: 0, duration: 0 };

  try {
    var rawResult = conn.socket.query(sql, params);
    result.rows = rawResult.rows;
    result.rowCount = rawResult.rows.length;
    result.duration = Date.now() - startTime;
  } catch (e: any) {
    activeQueries--;
    releaseConnection(conn);

    // Retry on connection errors
    if (e.code === 'CONNECTION_LOST' && maxRetries > 0) {
      conn.connected = false;
      maxRetries--;
      return executeQuery(config, sql, params);
    }
    throw e;
  }

  activeQueries--;
  releaseConnection(conn);
  return result;
}

function processResults(results: QueryResult) {
  if (results == null) return [];

  var processed: any[] = [];
  for (var i = 0; i < results.rows.length; i++) {
    var row = results.rows[i];
    var item: any = {};

    for (var key in row) {
      if (row.hasOwnProperty(key)) {
        // Convert null values to empty strings for display
        if (row[key] == null) {
          item[key] = '';
        } else {
          item[key] = row[key];
        }
      }
    }

    processed.push(item);
  }

  return processed;
}

function cleanupPool() {
  var now = Date.now();
  var timeout = 300000; // 5 minutes
  var cleaned = 0;

  for (var i = connectionPool.length - 1; i >= 0; i--) {
    var conn = connectionPool[i];
    if (!conn.inUse && (now - conn.lastUsed) > timeout) {
      if (conn.socket != null) {
        conn.socket.close();
      }
      connectionPool.splice(i, 1);
      cleaned++;
    }
  }

  return cleaned;
}

function getPoolStats() {
  var stats = {
    total: connectionPool.length,
    active: 0,
    idle: 0,
    dead: 0,
  };

  for (var i = 0; i < connectionPool.length; i++) {
    var conn = connectionPool[i];
    if (conn.inUse) {
      stats.active++;
    } else if (conn.connected) {
      stats.idle++;
    } else {
      stats.dead++;
    }
  }

  return stats;
}

// Stub for external dependency
declare function connectToDatabase(
  host: string, port: number, database: string,
  username: string, password: string, ssl: boolean
): any;

export {
  createConnection,
  getConnection,
  releaseConnection,
  executeQuery,
  processResults,
  cleanupPool,
  getPoolStats,
};
