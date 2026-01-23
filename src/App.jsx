import './App.css'

function App() {
  //This will be replaced by a database pull
  const users = [
    { id: 1, name: "Henry" },       // the whole team column
    { id: 2, name: "John" },
    { id: 3, name: "Alice" },
    { id: 4, name: "Bob" }
  ];

  //This will be replaced by a database pull as well
  const assignments = [
    { id: 1, userId: 1, text: "Finish project proposal" },
    { id: 2, userId: 2, text: "Write API endpoints" },
    { id: 3, userId: 3, text: "Create UI mockups" },
    { id: 4, userId: 4, text: "Set up database schema" }
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
          /* Users flow through here */
          <div key={user.id} className="Column">
            <h2>{user.name}</h2>
            {/* Assignments flow through this */}
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
