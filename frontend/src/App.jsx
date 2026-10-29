import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const emptyForm = {
  name: "",
  email: "",
  department: "",
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(", ")
        : detail || "Something went wrong.";

      throw new Error(message);
    }

    return data;
  }

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const data = await request("/employees");
      setEmployees(data);
    } catch (err) {
      setError(
        `${err.message} Check that FastAPI and MongoDB are running.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const isEditing = Boolean(editingId);

      const savedEmployee = await request(
        isEditing ? `/employees/${editingId}` : "/employees",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(form),
        }
      );

      setMessage(
        isEditing
          ? "Employee updated successfully!"
          : "Employee created successfully!"
      );

      setSelectedEmployee(savedEmployee);
      resetForm();
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewEmployee(id) {
    setError("");
    setMessage("");

    try {
      const employee = await request(`/employees/${id}`);
      setSelectedEmployee(employee);
    } catch (err) {
      setError(err.message);
    }
  }

  function editEmployee(employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
    });
    setSelectedEmployee(employee);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEmployee(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await request(`/employees/${employee.id}`, {
        method: "DELETE",
      });

      setMessage(`${employee.name} deleted successfully!`);

      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee(null);
      }

      if (editingId === employee.id) {
        resetForm();
      }

      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <div>
            <h1>EmployeeHub</h1>
            <p>Employee Management System</p>
          </div>
        </div>

        <div className="api-status">
          <span className="status-dot" />
          FastAPI + MongoDB
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div>
            <p className="eyebrow">DASHBOARD / EMPLOYEES</p>
            <h2>Manage your team.</h2>
            <p className="welcome-text">
              Create, view, update, and remove employee records.
            </p>
          </div>

          <button className="secondary-button" onClick={loadEmployees}>
            ↻ Refresh records
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total employees</span>
            <strong>{employees.length}</strong>
            <span className="stat-note">Records in your database</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Departments</span>
            <strong>
              {new Set(
                employees.map((employee) => employee.department)
              ).size}
            </strong>
            <span className="stat-note">Unique departments</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">API operations</span>
            <strong>4</strong>
            <span className="stat-note">POST · GET · PUT · DELETE</span>
          </div>
        </section>

        {error && (
          <div className="alert error-alert" role="alert">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert success-alert" role="status">
            {message}
          </div>
        )}

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {editingId ? "UPDATE RECORD" : "NEW RECORD"}
                </p>
                <h3>{editingId ? "Edit employee" : "Add employee"}</h3>
              </div>
              <span className="panel-icon">
                {editingId ? "✎" : "+"}
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Kartik Tyagi"
                minLength={2}
                required
              />

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="employee@company.com"
                required
              />

              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
                required
              />

              <button className="primary-button submit-button" type="submit">
                {editingId ? "Save changes →" : "Create employee →"}
              </button>

              {editingId && (
                <button
                  className="secondary-button cancel-button"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <p className="form-footnote">
              Employee data is stored in your MongoDB database.
            </p>
          </div>

          <div className="panel employees-panel">
            <div className="panel-heading employees-heading">
              <div>
                <p className="eyebrow">YOUR DATABASE</p>
                <h3>Employee records</h3>
              </div>
              <span className="count-badge">{employees.length} total</span>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loader" />
                <p>Loading employee records...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h4>No employees yet</h4>
                <p>Create your first employee using the form.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>DEPARTMENT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-cell">
                            <div className="avatar">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{employee.name}</strong>
                              <span>{employee.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="department-tag">
                            {employee.department}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              className="action-button view-action"
                              title="View employee"
                              onClick={() => viewEmployee(employee.id)}
                            >
                              View
                            </button>

                            <button
                              className="action-button edit-action"
                              title="Edit employee"
                              onClick={() => editEmployee(employee)}
                            >
                              Edit
                            </button>

                            <button
                              className="action-button delete-action"
                              title="Delete employee"
                              onClick={() => deleteEmployee(employee)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {selectedEmployee && (
          <section className="panel detail-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">READ ONE / GET BY ID</p>
                <h3>Employee details</h3>
              </div>

              <button
                className="close-button"
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close employee details"
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div>
                <span>Full name</span>
                <strong>{selectedEmployee.name}</strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>{selectedEmployee.email}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{selectedEmployee.department}</strong>
              </div>
              <div>
                <span>MongoDB ID</span>
                <code>{selectedEmployee.id}</code>
              </div>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>EmployeeHub</span>
          <span>React · FastAPI · MongoDB</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
