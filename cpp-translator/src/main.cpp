#include <string>
#include <iostream>
#include <stdexcept>
#include <algorithm>
#include <cctype>
#include <ctime>
#include <cstdlib>
#include <sstream>

#ifdef _WIN32
#include <windows.h>
#endif

using namespace std;

string parse_expression(const string& expr, size_t& pos);
string parse_term(const string& expr, size_t& pos);

void trim_left(const string& s, size_t& pos) {
    while (pos < s.length() && isspace(s[pos])) {
        pos++;
    }
}

bool consume(const string& s, size_t& pos, char c) {
    trim_left(s, pos);
    if (pos < s.length() && s[pos] == c) {
        pos++;
        return true;
    }
    return false;
}

string parse_identifier(const string& expr, size_t& pos) {
    trim_left(expr, pos);
    size_t start_pos = pos;
    while (pos < expr.length() && (isalnum(expr[pos]) || expr[pos] == '_')) {
        pos++;
    }
    if (start_pos == pos) {
        throw runtime_error("Expected an identifier (e.g., table name).");
    }
    return expr.substr(start_pos, pos - start_pos);
}

string wrap_if_subquery(const string& sql) {
    if (sql.find(' ') == string::npos && sql.find('(') == string::npos) {
        return sql;
    }
    stringstream ss;
    ss << "(" << sql << ") T_" << rand();
    return ss.str();
}

string parse_projection(const string& expr, size_t& pos) {
    trim_left(expr, pos);
    size_t parenthesis_pos = expr.find('(', pos);
    if (parenthesis_pos == string::npos) {
        throw runtime_error("Syntax error in Project (π): missing '('.");
    }
    string attributes = expr.substr(pos, parenthesis_pos - pos);
    attributes.erase(attributes.find_last_not_of(" \t\n\r") + 1);
    pos = parenthesis_pos;
    string inner_sql = parse_expression(expr, pos);
    string from_clause;
    if (inner_sql.find("SELECT") != string::npos || inner_sql.find("UNION") != string::npos) {
        from_clause = wrap_if_subquery(inner_sql);
    } else {
        from_clause = inner_sql;
    }
    return "SELECT " + attributes + " FROM " + from_clause;
}

string parse_selection(const string& expr, size_t& pos) {
    trim_left(expr, pos);
    size_t parenthesis_pos = expr.find('(', pos);
    if (parenthesis_pos == string::npos) {
        throw runtime_error("Syntax error in Select (σ): missing '('.");
    }
    string condition = expr.substr(pos, parenthesis_pos - pos);
    condition.erase(condition.find_last_not_of(" \t\n\r") + 1);
    pos = parenthesis_pos;
    string inner_sql = parse_expression(expr, pos);
    string from_clause;
     if (inner_sql.find("SELECT") != string::npos || inner_sql.find("UNION") != string::npos) {
        from_clause = wrap_if_subquery(inner_sql);
    } else {
        from_clause = inner_sql;
    }
    return "SELECT * FROM " + from_clause + " WHERE " + condition;
}

string parse_term(const string& expr, size_t& pos) {
    trim_left(expr, pos);
    if (pos >= expr.length()) {
        throw runtime_error("Unexpected end of expression.");
    }

    if (expr.compare(pos, 2, u8"π") == 0) {
        pos += 2;
        return parse_projection(expr, pos);
    }
    if (expr.compare(pos, 2, u8"σ") == 0) {
        pos += 2;
        return parse_selection(expr, pos);
    }

    if (expr[pos] == '(') {
        pos++;
        string result = parse_expression(expr, pos);
        if (!consume(expr, pos, ')')) {
            throw runtime_error("Syntax error: mismatched parentheses.");
        }
        return result;
    }

    return parse_identifier(expr, pos);
}

string parse_expression(const string& expr, size_t& pos) {
    string left_sql = parse_term(expr, pos);

    while (true) {
        trim_left(expr, pos);

        if (pos < expr.length() && expr.compare(pos, 3, u8"∪") == 0) {
            pos += 3;
            string right_sql = parse_term(expr, pos);
            left_sql = "(" + left_sql + ") UNION (" + right_sql + ")";
        }
        else if (pos < expr.length() && expr.compare(pos, 1, "-") == 0) {
            pos += 1;
            string right_sql = parse_term(expr, pos);
            left_sql = "(" + left_sql + ") EXCEPT (" + right_sql + ")";
        }
        else if (pos < expr.length() && expr.compare(pos, 3, u8"⨝") == 0) {
            pos += 3;
            string right_sql = parse_term(expr, pos);
            left_sql = "SELECT * FROM " + wrap_if_subquery(left_sql) + " NATURAL JOIN " + wrap_if_subquery(right_sql);
        }
        else if (pos < expr.length() && expr.compare(pos, 2, u8"×") == 0) {
            pos += 2;
            string right_sql = parse_term(expr, pos);
            left_sql = "SELECT * FROM " + wrap_if_subquery(left_sql) + " CROSS JOIN " + wrap_if_subquery(right_sql);
        }
        else {
            break;
        }
    }

    return left_sql;
}

string parse_and_translate(const string& input) {
    if (input.empty()) {
        return "Please enter a relational algebra expression.";
    }
    try {
        size_t pos = 0;
        string result = parse_expression(input, pos);
        trim_left(input, pos);
        if (pos < input.length()) {
             return "Error: Could not parse entire expression. Remainder starts at: " + input.substr(pos);
        }
        return result + ";";

    } catch (const runtime_error& e) {
        return "Parsing Error: " + string(e.what());
    }
}

int main() {
    #ifdef _WIN32
    SetConsoleCP(CP_UTF8);
    SetConsoleOutputCP(CP_UTF8);
    #endif

    srand(time(0));
    string line;

    if (getline(cin, line)) {
        string sql_result = parse_and_translate(line);
        cout << sql_result << endl;
    }
    return 0;
}
