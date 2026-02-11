import Widget from "./Widget";
import Task from "../Task";

function TaskCard({ task }) {
    return (
        <div className="task-card">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
        </div>
    );
}