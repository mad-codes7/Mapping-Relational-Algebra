# Relational Algebra to MySQL Translator

This is a **desktop application** that translates **Relational Algebra (RA)** expressions into **SQL**, executes the query on a **local MySQL database**, and displays the results in a **simple, retro-style UI**.

---

## 🧩 Architecture Overview

This project uses a **hybrid architecture**:

1. **C++ Backend (`cpp-translator`)**
   A high-performance, zero-dependency **C++17 command-line tool** that handles all complex parsing and translation of RA expressions.

2. **Electron Frontend (`electron-gui`)**
   A modern **Electron.js** app that provides the user interface, spawns the C++ tool as a child process to generate SQL, and connects to MySQL using **Node.js (mysql2)** to execute queries.

---

## 🖼️ Screenshot

> *<img width="1199" height="952" alt="image" src="https://github.com/user-attachments/assets/a0ee34e9-68b0-4099-a574-b83ef6b9b0c5" />
*

---

## 🚀 Features

* Translate complex **Relational Algebra expressions** (`Select`, `Project`, `Join`, `Union`, `Difference`, `Product`)
* Uses **UTF-8 symbols** (σ, π, ⨝, ∪, −, ×)
* Executes the generated SQL query directly against a **local MySQL database**
* Displays both the **generated SQL** and **live query results**
* Modular design — decoupled **C++ logic** from the **UI** to avoid driver conflicts

---

## ⚙️ Prerequisites

Before you begin, ensure the following are installed:

* [Node.js](https://nodejs.org/) (includes npm)
* A **C++17 compiler** (e.g., MinGW on Windows, GCC on Linux, Clang on macOS)
* [CMake](https://cmake.org/download/)
* A **local MySQL instance** with a database and tables to query

---

## 🧱 How to Build and Run

Follow these steps to get the application running.

### 1️⃣ Build the C++ Translator

```bash
# 1. Clone this repository
git clone https://github.com/your-username/dbms4.git
cd dbms4/cpp-translator

# 2. Create a build folder
mkdir build
cd build

# 3. Configure the project
# On Windows (MinGW):
cmake -G "MinGW Makefiles" ..
# On macOS/Linux:
# cmake ..

# 4. Build the executable
cmake --build .
```

This will create `RelationalAlgebraMapper.exe` (or `RelationalAlgebraMapper` on Linux/macOS) inside `cpp-translator/build`.
The Electron app is already configured to locate it there.

---

### 2️⃣ Configure and Run the Electron GUI

```bash
# 1. Go to the electron-gui folder
cd ../../electron-gui

# 2. Install all dependencies
npm install
```

#### ⚠️ Important: Configure Your Database

Before running the app, edit the **database connection settings**:

1. Open `electron-gui/main.js`
2. Locate the `dbPool` object (around line 17)
3. Update your MySQL credentials:

```js
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',        // <-- EDIT THIS
  password: 'your_mysql_password', // <-- EDIT THIS
  database: 'your_database_name',  // <-- EDIT THIS (e.g., event_management_db2)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

---

### ▶️ Run the Application

```bash
npm start
```

---

## 💡 Usage

1. Launch the app.
2. Enter your **Relational Algebra expression** in the input box.
3. Use the **symbol buttons** (σ, π, ⨝, etc.) for convenience.
4. Click **“Translate & Run”**.
5. View the **generated SQL** and **query results** below.

---

## 🧠 Sample Syntax

| Operation      | Syntax Example          |
| -------------- | ----------------------- |
| **Select**     | σ condition (Relation)  |
| **Project**    | π attributes (Relation) |
| **Join**       | Relation1 ⨝ Relation2   |
| **Union**      | (Expr1) ∪ (Expr2)       |
| **Difference** | (Expr1) − (Expr2)       |
| **Product**    | Relation1 × Relation2   |

### Example:

```
π name, venue (σ theme = 'Tech' (event))
```

---

## 📂 Table of Contents

* Relational Algebra to MySQL Translator
* Screenshot
* Features
* Prerequisites
* How to Build and Run

  * Build the C++ Translator
  * Configure and Run the Electron GUI
* Usage
* Sample Syntax

---

**Made with ❤️ for database enthusiasts**
