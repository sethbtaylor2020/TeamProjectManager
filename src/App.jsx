import { Link } from 'react-router-dom'
import './App.css'
import { useState } from 'react';
import supabase from "./config/supabaseClient"

function App() {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAssignmentMenu, setShowAssignmentMenu] = useState(false);

  // Assignmnet functionality
  const [form, setForm] = useState({ name: "", password: "", message: "" }); 
  const [feedback, setFeedback] = useState("");

  function handleChange(e) { 
    setForm({ ...form, [e.target.name]: e.target.value }); 
  } 

  function handleSubmit(e) { 
    // prevents page reload console.log("Form submitted:", form); 
    e.preventDefault();

    // Build the message
    const msg = `Hello ${form.name}! Thank you for your message. We will get back with you as soon as possible!`;
    setFeedback(msg);

    // Toggle the moveDown class on the body
    document.body.classList.toggle("moveDown");
    setForm({ name: "", password: "", message: "" });
  }

  //This will be replaced by a database pull
  const users = [
    { id: 1, name: "Henry" },       // the whole team column
    { id: 2, name: "John" },
    { id: 3, name: "Alice" },
    { id: 4, name: "Bob" }
  ]

// TEST!!!! IF BROKEN COMMENT OUT
// console.log(supabase)
// END TEST AREA

  //This will be replaced by a database pull as well
  const assignments = [
    { id: 1, userId: 1, text: "Finish project proposal" },
    { id: 2, userId: 2, text: "Write API endpoints" },
    { id: 3, userId: 3, text: "Create UI mockups" },
    { id: 4, userId: 4, text: "Set up database schema" }
  ]

  function setTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--bg-color", "#1a1a1a");
      root.style.setProperty("--box-color", "#333333");
      root.style.setProperty("--text-color", "#f0f0f0");
    }

    if (theme === "ocean") {
      root.style.setProperty("--bg-color", "#003f5c");
      root.style.setProperty("--box-color", "#2f4b7c");
      root.style.setProperty("--text-color", "#ffffff");
    }

    if (theme === "sunset") {
      root.style.setProperty("--bg-color", "#ff9e80");
      root.style.setProperty("--box-color", "#ff6e40");
      root.style.setProperty("--text-color", "#3a1f04");
    }
  }

  return (
    <>
      <Link to="/page2">Go to Page 2</Link>

      <div>
        <h1>Team Project Helper</h1>
      </div>

      <div className="Columns">
        <div className="Column">
          <h2>Team</h2>
        </div>

        {users.map(user => (
          <div key={user.id} className="Column">
            <h2>{user.name}</h2>

            {assignments
              .filter(a => a.userId === user.id)
              .map(a => (
                <p key={a.id}>{a.text}</p>
              ))}
          </div>
        ))}
      </div>
      <button onClick={() => setShowThemeMenu(!showThemeMenu)}>Themes</button>
      <button onClick={() => setShowAssignmentMenu(!showAssignmentMenu)}>Add Tasks</button>
      <div>
        <form class="box" onSubmit={handleSubmit} className={showAssignmentMenu ? "assignment-visible" : "assingment-hidden"}>
          <p>User Name</p>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="User name" />
          <p>Password</p>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
          <p>Task</p>
          <textarea name="message" value={form.message} onChange={handleChange} placeholder="Your message" />

          <button type="submit">Submit</button>
        </form>
      </div>
      <div id="theme" className={showThemeMenu ? "theme-visible" : "theme-hidden"}>
        <button onClick={() => setTheme("dark")}>Dark</button>
        <button onClick={() => setTheme("ocean")}>Ocean</button>
        <button onClick={() => setTheme("sunset")}>Sunset</button>
      </div>
    </>
  )
}

export default App