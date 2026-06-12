#include <string>
#include <iostream>
#include <stdexcept>
#include <memory>
#include <sstream>
#include <cctype>
#include <ctime>
#include <cstdlib>

#ifdef _WIN32
#include <windows.h>
#endif

using namespace std;
using NodePtr = unique_ptr<struct ASTNode>;

// ── Utility ───────────────────────────────────────────────────────────────────

static string wrap(const string& sql) {
    if (sql.find(' ') == string::npos && sql.find('(') == string::npos)
        return sql;
    stringstream ss;
    ss << "(" << sql << ") T_" << rand();
    return ss.str();
}

static bool isComplex(const string& sql) {
    return sql.find("SELECT") != string::npos
        || sql.find("UNION")  != string::npos
        || sql.find("INTERSECT") != string::npos;
}

// ── AST Nodes ─────────────────────────────────────────────────────────────────

struct ASTNode {
    virtual string toSQL() const = 0;
    virtual ~ASTNode() = default;
};

struct RelationNode : ASTNode {
    string name;
    explicit RelationNode(string n) : name(move(n)) {}
    string toSQL() const override { return name; }
};

struct ProjectionNode : ASTNode {
    string attrs; NodePtr child;
    ProjectionNode(string a, NodePtr c) : attrs(move(a)), child(move(c)) {}
    string toSQL() const override {
        return "SELECT " + attrs + " FROM " + wrap(child->toSQL());
    }
};

struct SelectionNode : ASTNode {
    string cond; NodePtr child;
    SelectionNode(string c, NodePtr ch) : cond(move(c)), child(move(ch)) {}
    string toSQL() const override {
        return "SELECT * FROM " + wrap(child->toSQL()) + " WHERE " + cond;
    }
};

struct RenameNode : ASTNode {
    string alias; NodePtr child;
    RenameNode(string a, NodePtr c) : alias(move(a)), child(move(c)) {}
    string toSQL() const override {
        string inner = child->toSQL();
        string from  = isComplex(inner) ? "(" + inner + ") AS " + alias
                                        : inner + " AS " + alias;
        return "SELECT * FROM " + from;
    }
};

struct UnionNode : ASTNode {
    NodePtr left, right;
    UnionNode(NodePtr l, NodePtr r) : left(move(l)), right(move(r)) {}
    string toSQL() const override {
        return "(" + left->toSQL() + ") UNION (" + right->toSQL() + ")";
    }
};

// requires MySQL 8.0.31+
struct IntersectionNode : ASTNode {
    NodePtr left, right;
    IntersectionNode(NodePtr l, NodePtr r) : left(move(l)), right(move(r)) {}
    string toSQL() const override {
        return "(" + left->toSQL() + ") INTERSECT (" + right->toSQL() + ")";
    }
};

// requires MySQL 8.0.31+
struct DifferenceNode : ASTNode {
    NodePtr left, right;
    DifferenceNode(NodePtr l, NodePtr r) : left(move(l)), right(move(r)) {}
    string toSQL() const override {
        return "(" + left->toSQL() + ") EXCEPT (" + right->toSQL() + ")";
    }
};

struct NaturalJoinNode : ASTNode {
    NodePtr left, right;
    NaturalJoinNode(NodePtr l, NodePtr r) : left(move(l)), right(move(r)) {}
    string toSQL() const override {
        return "SELECT * FROM " + wrap(left->toSQL())
             + " NATURAL JOIN " + wrap(right->toSQL());
    }
};

struct ThetaJoinNode : ASTNode {
    NodePtr left, right; string cond;
    ThetaJoinNode(NodePtr l, NodePtr r, string c)
        : left(move(l)), right(move(r)), cond(move(c)) {}
    string toSQL() const override {
        return "SELECT * FROM " + wrap(left->toSQL())
             + " JOIN "         + wrap(right->toSQL())
             + " ON "           + cond;
    }
};

struct CartesianProductNode : ASTNode {
    NodePtr left, right;
    CartesianProductNode(NodePtr l, NodePtr r) : left(move(l)), right(move(r)) {}
    string toSQL() const override {
        return "SELECT * FROM " + wrap(left->toSQL())
             + " CROSS JOIN "   + wrap(right->toSQL());
    }
};

// ── Parser ────────────────────────────────────────────────────────────────────

class Parser {
    const string& input;
    size_t pos = 0;

    void trim() {
        while (pos < input.size() && isspace(input[pos])) pos++;
    }

    bool consume(char c) {
        trim();
        if (pos < input.size() && input[pos] == c) { pos++; return true; }
        return false;
    }

    string readIdentifier() {
        trim();
        size_t start = pos;
        while (pos < input.size() && (isalnum(input[pos]) || input[pos] == '_')) pos++;
        if (start == pos) throw runtime_error("Expected identifier (table/column name).");
        return input.substr(start, pos - start);
    }

    // Read raw token up to the first '(' from current pos
    string readUntilParen() {
        trim();
        size_t paren = input.find('(', pos);
        if (paren == string::npos) throw runtime_error("Missing '(' in expression.");
        string token = input.substr(pos, paren - pos);
        token.erase(token.find_last_not_of(" \t\n\r") + 1);
        pos = paren;
        return token;
    }

    // Read condition between balanced parentheses; pos advances past closing ')'
    string readCondition() {
        pos++; // consume '('
        size_t start = pos;
        int depth = 1;
        while (pos < input.size() && depth > 0) {
            if      (input[pos] == '(') depth++;
            else if (input[pos] == ')') depth--;
            pos++;
        }
        string cond = input.substr(start, pos - start - 1);
        cond.erase(0, cond.find_first_not_of(" \t"));
        cond.erase(cond.find_last_not_of(" \t") + 1);
        return cond;
    }

    NodePtr parseProjection() {
        string attrs = readUntilParen();
        return make_unique<ProjectionNode>(attrs, parseExpression());
    }

    NodePtr parseSelection() {
        string cond = readUntilParen();
        return make_unique<SelectionNode>(cond, parseExpression());
    }

    NodePtr parseRename() {
        trim();
        string alias = readIdentifier();
        trim();
        return make_unique<RenameNode>(alias, parseExpression());
    }

    NodePtr parseTerm() {
        trim();
        if (pos >= input.size()) throw runtime_error("Unexpected end of expression.");

        // Greek letters are 2-byte UTF-8 (U+03xx range)
        if (input.compare(pos, 2, u8"π") == 0) { pos += 2; return parseProjection(); }
        if (input.compare(pos, 2, u8"σ") == 0) { pos += 2; return parseSelection();  }
        if (input.compare(pos, 2, u8"ρ") == 0) { pos += 2; return parseRename();     }

        if (input[pos] == '(') {
            pos++;
            NodePtr inner = parseExpression();
            if (!consume(')')) throw runtime_error("Mismatched parentheses.");
            return inner;
        }

        return make_unique<RelationNode>(readIdentifier());
    }

    NodePtr parseExpression() {
        NodePtr left = parseTerm();

        while (true) {
            trim();

            // ∪ U+222A = 3 bytes
            if (pos < input.size() && input.compare(pos, 3, u8"∪") == 0) {
                pos += 3;
                left = make_unique<UnionNode>(move(left), parseTerm());
            }
            // ∩ U+2229 = 3 bytes — requires MySQL 8.0.31+
            else if (pos < input.size() && input.compare(pos, 3, u8"∩") == 0) {
                pos += 3;
                left = make_unique<IntersectionNode>(move(left), parseTerm());
            }
            // − set difference — requires MySQL 8.0.31+
            else if (pos < input.size() && input.compare(pos, 1, "-") == 0) {
                pos += 1;
                left = make_unique<DifferenceNode>(move(left), parseTerm());
            }
            // ⨝ U+2A1D = 3 bytes
            // ⨝(condition) R → Theta Join;  ⨝ R → Natural Join
            else if (pos < input.size() && input.compare(pos, 3, u8"⨝") == 0) {
                pos += 3;
                trim();
                if (pos < input.size() && input[pos] == '(') {
                    string cond = readCondition();
                    left = make_unique<ThetaJoinNode>(move(left), parseTerm(), cond);
                } else {
                    left = make_unique<NaturalJoinNode>(move(left), parseTerm());
                }
            }
            // × U+00D7 = 2 bytes
            else if (pos < input.size() && input.compare(pos, 2, u8"×") == 0) {
                pos += 2;
                left = make_unique<CartesianProductNode>(move(left), parseTerm());
            }
            else { break; }
        }

        return left;
    }

public:
    explicit Parser(const string& expr) : input(expr), pos(0) {}

    string translate() {
        if (input.empty()) return "Please enter a relational algebra expression.";
        try {
            NodePtr root = parseExpression();
            trim();
            if (pos < input.size())
                return "Error: Could not parse entire expression. Leftover: '" + input.substr(pos) + "'";
            return root->toSQL() + ";";
        } catch (const runtime_error& e) {
            return "Parsing Error: " + string(e.what());
        }
    }
};

// ── Entry point ───────────────────────────────────────────────────────────────

int main() {
    #ifdef _WIN32
    SetConsoleCP(CP_UTF8);
    SetConsoleOutputCP(CP_UTF8);
    #endif

    srand(time(0));
    string line;
    if (getline(cin, line)) {
        Parser parser(line);
        cout << parser.translate() << endl;
    }
    return 0;
}
