import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import './App.css'
import { StrictMode } from 'react'
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';

function App() {
  // Enhanced state management
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [responsible, setResponsible] = useState('Marian')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
  const [timeOfDay, setTimeOfDay] = useState('morning')

  // Categories and priorities
  const priorities = ['Baja', 'Media', 'Alta', 'Urgente']
  const responsiblePersons = ['Marian', 'Javier', 'Rosi']
  const timeOptions = ['Mañana', 'Tarde', 'Noche']

  // Load and save with enhanced data
  useEffect(() => {
    // Create a query to get todos ordered by creation time
    const q = query(collection(db, 'todos'), orderBy('created', 'desc'));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTodos(todosData);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Add reminder check on component mount and when todos change
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const upcoming = todos.filter(todo => {
        if (todo.completed) return false
        const dueDate = new Date(todo.dueDate)
        const timeDiff = dueDate.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)
        return hoursDiff > 0 && hoursDiff < 24 // Due within 24 hours
      })

      if (upcoming.length > 0) {
        const newNotifications = upcoming.map(todo => ({
          id: todo.id,
          message: `"${todo.text}" vence el ${new Date(todo.dueDate).toLocaleString()}`
        }))
        setNotifications(newNotifications)
      }
    }

    // Check every minute
    const intervalId = setInterval(checkReminders, 60000)
    checkReminders() // Check immediately

    return () => clearInterval(intervalId)
  }, [todos])

  // Enhanced add todo function
  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo = {
      text: inputValue,
      completed: false,
      priority,
      responsible,
      timeOfDay,
      dueDate: dueDate.toISOString(),
      subtasks: [],
      created: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'todos'), newTodo);
      setInputValue('');
    } catch (error) {
      console.error("Error adding todo: ", error);
    }
  };

  // Edit todo function
  const editTodo = (id, newText) => {
    if (!newText.trim()) return;  // Don't allow empty text
    setTodos(todos.map(todo => 
      todo.id === id ? {...todo, text: newText} : todo
    ));
    setEditingId(null);
  }

  // Add subtask function
  const addSubtask = (todoId, subtaskText) => {
    setTodos(todos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: [...todo.subtasks, {
            id: Date.now(),
            text: subtaskText,
            completed: false
          }]
        }
      }
      return todo
    }))
  }

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    const newTodos = Array.from(todos);
    const [movedItem] = newTodos.splice(sourceIndex, 1);
    newTodos.splice(destIndex, 0, movedItem);
    
    setTodos(newTodos);
  };

  // Enhanced filtering and searching
  const filteredAndSearchedTodos = todos
    .filter(todo => {
      // Filter by status
      if (filter === 'active') return !todo.completed
      if (filter === 'completed') return todo.completed
      return true
    })
    .filter(todo => {
      // Filter by responsible person
      if (responsibleFilter !== 'todos') return todo.responsible === responsibleFilter
      return true
    })
    .filter(todo => {
      // Filter by search term
      return todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      // Sort by priority
      const priorityOrder = { Urgente: 0, Alta: 1, Media: 2, Baja: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

  // Function to toggle todo completion status
  const toggleTodo = async (id) => {
    const todoRef = doc(db, 'todos', id);
    const todo = todos.find(t => t.id === id);
    try {
      await updateDoc(todoRef, {
        completed: !todo.completed
      });
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  // Function to delete a todo
  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (error) {
      console.error("Error deleting todo: ", error);
    }
  };

  // Show notification
  const showNotificationMessage = (message) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 5000) // Hide after 5 seconds
  }

  return (
    <div className="todo-app">
      {showNotification && (
        <div className="notification">
          {notificationMessage}
        </div>
      )}
      {notifications.length > 0 && (
        <div className="notifications-panel">
          <h3>Tareas Próximas</h3>
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className="notification-item"
              onClick={() => showNotificationMessage(notif.message)}
            >
              {notif.message.replace('is due', 'vence el')}
            </div>
          ))}
        </div>
      )}
      <h1>Tareas Javier y Marian</h1>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Buscar Tareas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {/* Enhanced todo form */}
      <form onSubmit={addTodo} className="todo-form">
        <div className="form-row">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe Aquí Tu Tarea..."
            className="todo-input"
          />
        </div>
        
        <div className="form-row">
          <select 
            value={responsible} 
            onChange={(e) => setResponsible(e.target.value)}
            className="responsible-select"
          >
            {responsiblePersons.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>

          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="priority-select"
          >
            {priorities.map(pri => (
              <option key={pri} value={pri}>{pri}</option>
            ))}
          </select>

          <select 
            value={timeOfDay} 
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="time-select"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>

          <DatePicker
            selected={dueDate}
            onChange={date => setDueDate(date)}
            className="date-picker"
          />

          <button type="submit" className="add-button">Agregar</button>
        </div>
      </form>

      {/* Add responsible filter buttons */}
      <div className="filters-container">
        <div className="filters">
          {['Todos', 'Activos', 'Completados'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType === 'Todos' ? 'all' : filterType === 'Activos' ? 'active' : 'completed')}
              className={filter === (filterType === 'Todos' ? 'all' : filterType === 'Activos' ? 'active' : 'completed') ? 'active' : ''}
            >
              {filterType}
            </button>
          ))}
        </div>
        
        <div className="filters responsible-filters">
          {['todos', ...responsiblePersons].map(person => (
            <button
              key={person}
              onClick={() => setResponsibleFilter(person)}
              className={responsibleFilter === person ? 'active' : ''}
            >
              {person}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and drop todo list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul 
              className="todo-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {filteredAndSearchedTodos.map((todo, index) => (
                <Draggable 
                  key={todo.id.toString()} 
                  draggableId={todo.id.toString()} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`todo-item priority-${todo.priority} ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                      />
                      
                      {editingId === todo.id ? (
                        <input
                          type="text"
                          value={todo.text}
                          onChange={(e) => editTodo(todo.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditingId(todo.id)}
                          style={{
                            textDecoration: todo.completed ? 'line-through' : 'none'
                          }}
                        >
                          {todo.text}
                        </span>
                      )}

                      <div className="todo-metadata">
                        <span className="responsible-tag">
                          {todo.responsible}
                        </span>
                        <span className={`priority-tag ${todo.priority}`}>
                          {todo.priority}
                        </span>
                        <span className="time-tag">
                          {todo.timeOfDay}
                        </span>
                        <span className="due-date">
                          Vence: {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-button"
                      >
                        Eliminar
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default App
