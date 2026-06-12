<div align="center">
  <img src="https://unpkg.com/lucide-static@latest/icons/database.svg" width="60" height="60" alt="Database Icon" />
  <h1>Relational Algebra to SQL Translator</h1>
  <p><i>A desktop application bridging theoretical database concepts with practical execution.</i></p>

 
</div>

---

## <img src="https://unpkg.com/lucide-static@latest/icons/layers.svg" width="24" height="24" align="center" /> Overview

The system translates complex Relational Algebra (RA) expressions into SQL, executes them against a local MySQL database, and displays the results in a clean, developer-focused interface. It utilizes a hybrid architecture that decouples parsing logic from the user interface. 

### Application Screenshot

![Application Screenshot](assets/screenshot.png)

---

## <img src="https://unpkg.com/lucide-static@latest/icons/code-2.svg" width="24" height="24" align="center" /> Tech Stack

![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

---

## <img src="https://unpkg.com/lucide-static@latest/icons/sparkles.svg" width="24" height="24" align="center" /> Key Features

* **Custom AST Parser:** A from-scratch C++17 parsing engine that constructs an Object-Oriented Abstract Syntax Tree for robust SQL translation.
* **Comprehensive Operator Support:** Handles Select, Project, Rename, Union, Difference, Intersection, Natural Join, Theta Join, and Cartesian Product.
* **Live Schema Introspection:** A sidebar schema browser that automatically fetches tables, columns, data types, and key constraints (PK/FK) from the connected MySQL database.
* **Secure Configuration:** Decoupled database credentials using environment variables (`.env`).
* **Developer-Focused UI:** Features a code editor theme, query history, and click-to-insert symbol panels utilizing crisp Lucide icons.

---

## <img src="https://unpkg.com/lucide-static@latest/icons/cpu.svg" width="24" height="24" align="center" /> Architecture & Design

### System Architecture

The application relies on Inter-Process Communication (IPC) to pass data between the UI, the Node.js backend, the C++ execution layer, and the database.

<!-- PLACE ARCHITECTURE DIAGRAM HERE (e.g. ![System Architecture](assets/architecture.png)) -->
> *Flow: User Input -> Electron IPC -> C++ Subprocess -> Generated SQL -> MySQL Query -> JSON Results -> UI Render.*

### C++ Parser (Object-Oriented Design)

The backend parser avoids string manipulation in favor of a strong OOP hierarchy.

<!-- PLACE CLASS DIAGRAM HERE (e.g. ![Class Diagram](assets/class-diagram.png)) -->
> *UML Class Diagram showing the `ASTNode` hierarchy (ProjectionNode, JoinNode, etc.) and the core `Parser` class.*

---

## <img src="https://unpkg.com/lucide-static@latest/icons/sigma.svg" width="24" height="24" align="center" /> Supported Operations

| Operation | Symbol | Syntax Example | Generated SQL Mapping |
| :--- | :--- | :--- | :--- |
| **Selection** | `σ` | `σ condition (R)` | `WHERE` clause |
| **Projection** | `π` | `π a,b (R)` | `SELECT a,b` |
| **Rename** | `ρ` | `ρ alias (R)` | `AS alias` |
| **Natural Join** | `⨝` | `R1 ⨝ R2` | `NATURAL JOIN` |
| **Theta Join** | `⨝(cond)`| `R1 ⨝(c) R2` | `JOIN ... ON cond` |
| **Union** | `∪` | `(A) ∪ (B)` | `UNION` |
| **Intersection**| `∩` | `(A) ∩ (B)` | `INTERSECT` *(Requires MySQL 8.0.31+)* |
| **Difference** | `−` | `(A) - (B)` | `EXCEPT` *(Requires MySQL 8.0.31+)* |
| **Product** | `×` | `R1 × R2` | `CROSS JOIN` |

---

## <img src="https://unpkg.com/lucide-static@latest/icons/download.svg" width="24" height="24" align="center" /> Installation & Setup

### Prerequisites
* **C++17 Compiler** (MinGW on Windows, GCC/Clang on Unix)
* **CMake** (v3.10+)
* **Node.js** (v16+)
* **MySQL** (v8.0+ recommended)

### 1. Build the C++ Translator

The parser must be compiled into an executable before running the app.

```bash
git clone https://github.com/mad-codes7/Mapping-Relational-Algebra.git
cd Mapping-Relational-Algebra/cpp-translator

# Create build directory
mkdir build
cd build

# Configure and compile
cmake -G "MinGW Makefiles" ..    # Use 'cmake ..' on macOS/Linux
cmake --build .
```

### 2. Configure Database Credentials

The Electron app requires access to your local MySQL database. Do not hardcode credentials.

```bash
cd ../../electron-gui

# Install Node dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Open the `.env` file and input your local database details:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD="your_password_here"
DB_NAME=your_database_name
```
*Note: Ensure passwords with special characters (like `#`) are wrapped in double quotes.*

### 3. Run the Application

```bash
npm start
```



---

## <img src="https://unpkg.com/lucide-static@latest/icons/mail.svg" width="24" height="24" align="center" /> Contact

For queries, collaborations, or suggestions, feel free to reach out:
* **Email:** [madhurbiradar.dev@gmail.com](mailto:madhurbiradar.dev@gmail.com)
* **GitHub:** [mad-codes7](https://github.com/mad-codes7)

---

<div align="center">
  <img src="https://unpkg.com/lucide-static@latest/icons/database-zap.svg" width="20" height="20" alt="Database Zap" />
  <p><b>Made for Database Lovers</b></p>
</div>
