export default function TaskModal({ task, onClose }) {
  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalles de la Tarea</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="modal-body">
          <div className="task-detail">
            <strong>Tarea:</strong> {task.text}
          </div>
          <div className="task-detail">
            <strong>Responsable:</strong> 
            <span className={`responsible-tag ${task.responsible.toLowerCase()}`}>
              {task.responsible}
            </span>
          </div>
          <div className="task-detail">
            <strong>Prioridad:</strong>
            <span className={`priority-tag ${task.priority}`}>
              {task.priority}
            </span>
          </div>
          <div className="task-detail">
            <strong>Horario:</strong>
            <span className="time-tag">
              {task.timeOfDay}
            </span>
          </div>
          <div className="task-detail">
            <strong>Fecha:</strong> {new Date(task.dueDate).toLocaleDateString('es-ES')}
          </div>
          <div className="task-detail">
            <strong>Estado:</strong> {task.completed ? 'Completada' : 'Pendiente'}
          </div>
        </div>
      </div>
    </div>
  );
} 