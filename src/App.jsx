import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'الكل', color: '#6366f1' },
    { id: 'work', name: 'عمل', color: '#ef4444' },
    { id: 'personal', name: 'شخصي', color: '#10b981' },
    { id: 'study', name: 'دراسة', color: '#f59e0b' },
    { id: 'health', name: 'صحة', color: '#ec4899' },
    { id: 'home', name: 'منزل', color: '#8b5cf6' }
  ];

  // تحميل المهام من التخزين المحلي
  useEffect(() => {
    const savedTasks = localStorage.getItem('tracklife_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // حفظ المهام في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('tracklife_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        title: newTask.trim(),
        category: selectedCategory === 'all' ? 'personal' : selectedCategory,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, task]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  const stats = getStats();

  return (
    <div className="app" dir="rtl">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1 className="title">تطبيق تتبع المهام والعادات</h1>
          <p className="subtitle">نظم مهامك وحقق أهدافك اليومية</p>
        </header>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">إجمالي المهام</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">مكتملة</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">معلقة</div>
          </div>
        </div>

        {/* Add Task Form */}
        <form className="add-task-form" onSubmit={handleAddTask}>
          <div className="form-group">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="أضف مهمة جديدة..."
              className="task-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit" className="add-button">
              إضافة
            </button>
          </div>
        </form>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              style={{ '--category-color': category.color }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="tasks-container">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>لا توجد مهام في هذا التصنيف</p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="task-checkbox"
                    />
                    <span className="task-title">{task.title}</span>
                    <span 
                      className="task-category"
                      style={{ 
                        backgroundColor: categories.find(c => c.id === task.category)?.color 
                      }}
                    >
                      {categories.find(c => c.id === task.category)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="delete-button"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

