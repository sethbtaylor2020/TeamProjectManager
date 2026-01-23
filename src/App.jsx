import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const users = [
    { id: 1, name: "John" },
    { id: 2, name: "Alice" },
    { id: 3, name: "Bob" }
  ];

  const assignments = [
    { id: 1, userId: 1, text: "Write API endpoints" },
    { id: 2, userId: 2, text: "Create UI mockups" },
    { id: 3, userId: 3, text: "Set up database schema" }
  ];

  return (
    <>
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
            {/* Assignments will go here later */}
            {assignments
              .filter(a => a.userId === user.id)
              .map(a => (
                <p key={a.id}>{a.text}</p>
              ))
            }
          </div>
        ))}
      </div>
    </>
  )
}

export default App
