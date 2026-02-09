import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Page2.css'

function Page2() {
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


  return (
    <>
      <Link to="/">Back to Home</Link>

      <div>
        <h1>Page 2</h1>
      </div>

      <div>
        <div id="feedback">{feedback}</div>
        <form onSubmit={handleSubmit}>
          <h1>User Name</h1>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="User name" />
          <h1>Password</h1>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
          <h1>Task</h1>
          <textarea name="message" value={form.message} onChange={handleChange} placeholder="Your message" />

          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  )
}

export default Page2