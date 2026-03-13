import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Page2 from './Page2.jsx'
import ProjectTaskManager from './ProjectTaskManager.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/TeamProjectManager">
    <Routes>
      <Route path="/projects" element={<App />} />
      <Route path="/page2" element={<Page2 />} />
      <Route path="/" element={<ProjectTaskManager />} />
    </Routes>
  </BrowserRouter>
)
