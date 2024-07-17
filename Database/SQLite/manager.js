const db = require('./index');

function upsertUserData(userId, data) {
  return new Promise((resolve, reject) => {
    if (isNaN(userId)) {
      return reject(new Error("UserID must be an integer"));
    }
    if (typeof userId === "string") {
      userId = parseInt(userId, 10);
    }
    const jsonData = JSON.stringify(data);
    db.run(
      `INSERT INTO users (id, data) VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      [userId, jsonData],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ status: 200, message: "User data upserted successfully" });
        }
      }
    );
  });
}

function getUserData(userId) {
  return new Promise((resolve, reject) => {
    if (isNaN(userId)) {
      return reject(new Error("UserID must be an integer"));
    }
    if (typeof userId === "string") {
      userId = parseInt(userId, 10);
    }
    db.get(`SELECT data FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        reject(new Error('Database error'));
      } else if (!row) {
        resolve(404);
      } else {
        resolve(JSON.parse(row.data));
      }
    });
  });
}

function deleteUser(userId) {
  return new Promise((resolve, reject) => {
    if (isNaN(userId)) {
      return reject(new Error("UserID must be an integer"));
    }
    if (typeof userId === "string") {
      userId = parseInt(userId, 10);
    }
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        resolve(404);
      } else {
        resolve(200);
      }
    });
  });
}

async function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id FROM users`, async (err, rows) => {
      if (err) {
        reject(new Error('Database error'));
      } else {
        try {
          const accs = await Promise.all(rows.map(async n => {
            return await getUserData(n.id);
          }));
          resolve(accs);
        } catch (error) {
          reject(new Error('Error fetching user data'));
        }
      }
    });
  });
}

function deleteAllUsers() {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users`, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(200);
      }
    });
  });
}

function exists(userId) {
  return new Promise((resolve, reject) => {
    if (isNaN(userId)) {
      return reject(new Error("UserID must be an integer"));
    }
    if (typeof userId === "string") {
      userId = parseInt(userId, 10);
    }
    db.get(`SELECT COUNT(*) as count FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        reject(new Error('Database error'));
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

async function createOrUpdateUser(userId, newData) {
  const existingData = await getUserData(userId);
  if (existingData === 404) {
    return 404;
  }
  const updatedData = { ...existingData, ...newData };
  return upsertUserData(userId, updatedData);
}

createOrUpdateUser.force = async function(userId, newData) {
  return upsertUserData(userId, newData);
};

createOrUpdateUser.empty = async function(userId) {
  return upsertUserData(userId, {});
};

createOrUpdateUser.refresh = async function(userId, event) {
  return upsertUserData(userId, { ...event.from, isBanned: false });
};

async function removeKey(userId, keys) {
  try {
    const existingData = await getUserData(userId);
    if (existingData === 404) {
      return 404;
    }
    keys.forEach(key => delete existingData[key]);
    return upsertUserData(userId, existingData);
  } catch (error) {
    throw new Error('Failed to remove keys: ' + error.message);
  }
}

const threadsData = {
  upsertThreadData(threadId, data) {
    return new Promise((resolve, reject) => {
      if (isNaN(threadId)) {
        return reject(new Error("threadID must be an integer"));
      }
      if (typeof threadId === "string") {
        threadId = parseInt(threadId, 10);
      }
      const jsonData = JSON.stringify(data);
      db.run(
        `INSERT INTO threads (id, data) VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      [threadId, jsonData],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ status: 200, message: "Thread data upserted successfully" });
          }
        }
      );
    });
  },

  getThreadData(threadId) {
    return new Promise((resolve, reject) => {
      if (isNaN(threadId)) {
        return reject(new Error("threadID must be an integer"));
      }
      if (typeof threadId === "string") {
        threadId = parseInt(threadId, 10);
      }
      db.get(`SELECT data FROM threads WHERE id = ?`, [threadId], (err, row) => {
        if (err) {
          reject(new Error('Database error'));
        } else if (!row) {
          resolve(404);
        } else {
          resolve(JSON.parse(row.data));
        }
      });
    });
  },
  deleteThread(threadId) {
    return new Promise((resolve, reject) => {
      if (isNaN(threadId)) {
        return reject(new Error("threadID must be an integer"));
      }
      if (typeof threadId === "string") {
        threadId = parseInt(threadId, 10);
      }
      db.run(`DELETE FROM threads WHERE id = ?`, [threadId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(404);
        } else {
          resolve(200);
        }
      });
    });
  },

  async getAllTID() {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT id FROM threads`, (err, rows) => {
          if (err) reject(new Error('Database error'));
          else resolve(rows);
        });
      });

      const accs = await Promise.all(
        rows.map(row => threadsData.getThreadData(row.id))
      );

      return accs;
    } catch (error) {
      throw error;
    }
  },

  threadExists(threadId) {
    return new Promise((resolve, reject) => {
      if (isNaN(threadId)) {
        return reject(new Error("threadID must be an integer"));
      }
      if (typeof threadId === "string") {
        threadId = parseInt(threadId, 10);
      }
      db.get(`SELECT COUNT(*) as count FROM threads WHERE id = ?`, [threadId], (err, row) => {
        if (err) {
          reject(new Error('Database error'));
        } else {
          resolve(row.count > 0);
        }
      });
    });
  },

  async createOrUpdateThread(threadId, newData) {
    try {
      if (isNaN(threadId)) {
        throw new Error("threadID must be an integer")
      }
      if (typeof newData !== "object") {
        throw new Error("Passed item must be an object")
      }
      if (typeof threadId === "string") {
        threadId = parseInt(threadId, 10);
      }
      const existingData = await threadsData.getThreadData(threadId);
      if (existingData === 404) {
        return 404;
      }
      const updatedData = { ...existingData, ...newData };
      return threadsData.upsertThreadData(threadId, updatedData);
    } catch (err) {
      throw err
    }
  },
  async removeKey(threadId, keys) {
    try {
      if (isNaN(threadId)) {
        throw new Error("threadID must be an integer");
      }

      if (!Array.isArray(keys) || keys.length === 0) {
        throw new Error("Keys must be a non-empty array");
      }

      const existingData = await threadsData.getThreadData(threadId);
      if (existingData === 404) {
        return 404;
      }

      keys.forEach(key => {
        if (key in existingData) {
          delete existingData[key];
        }
      });

      return await threadsData.upsertThreadData(threadId, existingData);
    } catch (error) {
      throw new Error('Failed to remove keys: ' + error.message);
    }
  }
};

threadsData.createOrUpdateThread.force = async function(threadId, newData) {
  return threadsData.upsertThreadData(threadId, newData);
};

threadsData.createOrUpdateThread.empty = async function(threadId) {
  return threadsData.upsertThreadData(threadId, {});
};

threadsData.createOrUpdateThread.refresh = async function(threadId, event) {
  return threadsData.upsertThreadData(threadId, { ...event.chat, isBanned: false });
};

const db = require('./index');

function upsertGlobalData(globalKey, data) {
  return new Promise((resolve, reject) => {
    if (!globalKey || !data) {
      return reject(new Error("Global key and data must be provided"));
    }

    const jsonData = typeof data === 'object' ? JSON.stringify(data) : data;

    db.run(
      `INSERT INTO globals (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [globalKey, jsonData],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ status: 200, message: "Global data upserted successfully" });
        }
      }
    );
  });
}

function getGlobalData(globalKey) {
  return new Promise((resolve, reject) => {
    if (!globalKey) {
      return reject(new Error("Global key must be provided"));
    }

    db.get(`SELECT value FROM globals WHERE key = ?`, [globalKey], (err, row) => {
      if (err) {
        reject(new Error('Database error'));
      } else if (!row) {
        resolve(404);
      } else {
        let value;
        try {
          value = JSON.parse(row.value);
        } catch (error) {
          value = row.value;
        }
        resolve({
          [globalKey]: value
        });
      }
    });
  });
}

function deleteGlobal(globalKey) {
  return new Promise((resolve, reject) => {
    if (!globalKey) {
      return reject(new Error("Global key must be provided"));
    }

    db.run(`DELETE FROM globals WHERE key = ?`, [globalKey], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        resolve(404);
      } else {
        resolve(200);
      }
    });
  });
}

async function getAllGlobals() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT key, value FROM globals`, (err, rows) => {
      if (err) {
        reject(new Error('Database error'));
      } else {
        const globals = {};
        rows.forEach(row => {
          let value;
          try {
            value = JSON.parse(row.value);
          } catch (error) {
            value = row.value;
          }
          globals[row.key] = value;
        });
        resolve(globals);
      }
    });
  });
}

async function createOrUpdateGlobal(globalKey, newData) {
  if (!globalKey || !newData) {
    throw new Error("Global key and data must be provided");
  }

  const existingData = await getGlobalData(globalKey);
  if (existingData === 404) {
    return upsertGlobalData(globalKey, newData);
  }

  const updatedData = { ...existingData[globalKey], ...newData };
  return upsertGlobalData(globalKey, updatedData);
}

async function removeGlobalKey(globalKey, keys) {
  try {
    const existingData = await getGlobalData(globalKey);
    if (existingData === 404) {
      return 404;
    }

    const data = existingData[globalKey];
    keys.forEach(key => delete data[key]);

    return upsertGlobalData(globalKey, data);
  } catch (error) {
    throw new Error('Failed to remove keys: ' + error.message);
  }
}

function globalExists(globalKey) {
  return new Promise((resolve, reject) => {
    if (!globalKey) {
      return reject(new Error("Global key must be provided"));
    }
    db.get(`SELECT COUNT(*) as count FROM globals WHERE key = ?`, [globalKey], (err, row) => {
      if (err) {
        reject(new Error('Database error'));
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

function removeAllGlobals() {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM globals`, function(err) {
      if (err) {
        reject(new Error('Failed to remove all globals: ' + err.message));
      } else {
        resolve({ status: 200, message: "All globals removed successfully" });
      }
    });
  });
}

module.exports = {
  threadsData: {
    update: threadsData.createOrUpdateThread,
    retrieve: threadsData.getThreadData,
    delete: threadsData.deleteThread,
    getAll: threadsData.getAllTID,
    exists: threadsData.threadExists,
    create: threadsData.createOrUpdateThread.empty,
    refresh: threadsData.createOrUpdateThread.refresh,
    removeKey: threadsData.removeKey
  },
  usersData: {
    update: createOrUpdateUser,
    retrieve: getUserData,
    delete: deleteUser,
    getAll: getAllUsers,
    // deleteAll: deleteAllUsers,
    exists,
    create: createOrUpdateUser.empty,
    refresh: createOrUpdateUser.refresh,
    removeKey
  },
  globalsData: {
    update: createOrUpdateGlobal,
    retrieve: getGlobalData,
    delete: deleteGlobal,
    getAll: getAllGlobals,
    exists: globalExists,
    removeKey: removeGlobalKey,
    removeAll: removeAllGlobals
  }
};