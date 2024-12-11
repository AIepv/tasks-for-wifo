import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import "react-big-calendar/lib/css/react-big-calendar.css"
import es from 'date-fns/locale/es'
import TaskModal from './TaskModal'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarView({ todos }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const events = todos.map(todo => {
    const date = new Date(todo.dueDate);
    
    // If it's an event with startTime, parse the time
    if (todo.type === 'event' && todo.startTime) {
      const [hours, minutes] = todo.startTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    } else {
      // For tasks, set a default time (beginning of day)
      date.setHours(9, 0, 0);
    }

    return {
      id: todo.id,
      title: `${todo.text} (${todo.responsible})`,
      start: date,
      end: date,
      allDay: todo.type !== 'event',
      resource: todo,
    };
  });

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        culture='es'
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día"
        }}
        eventPropGetter={(event) => ({
          className: `calendar-event ${event.resource.type === 'task' ? 
            `priority-${event.resource.priority.toLowerCase()}` : 
            'event-type'}`
        })}
        onSelectEvent={(event) => setSelectedTask(event.resource)}
      />
      <TaskModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </div>
  );
} 