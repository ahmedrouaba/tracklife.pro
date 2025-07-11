import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTasks } from './hooks/useTasks';
import './App.css';

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const { 
    tasks, 
    loading, 
    error, 
    isOnline, 
    syncStatus, 
    addTask, 
    updateTask, 
    deleteTask, 
    manualSync 
  } = useTasks();

  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const categories = [
    { id: 'all', name: t.categories.all, color: '#6366f1' },
    { id: 'work', name: t.categories.work, color: '#ef4444' },
    { id: 'personal', name: t.categories.personal, color: '#10b981' },
    { id: 'study', name: t.categories.study, color: '#f59e0b' },
    { id: 'health', name: t.categories.health, color: '#ec4899' },
    { id: 'home', name: t.categories.home, color: '#8b5cf6' }
  ];

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      try {
        await addTask({
          title: newTask.trim(),
          category: selectedCategory === 'all' ? 'personal' : selectedCategory,
          completed: false,
          priority: 'medium'
        });
        setNewTask('');
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        await updateTask(taskId, { completed: !task.completed });
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id);
        setShowDeleteConfirm(false);
        setTaskToDelete(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const totalTasks = filteredTasks.length;

  const getCategoryStats = () => {
    return categories.slice(1).map(category => {
      const categoryTasks = tasks.filter(task => task.category === category.id);
      const completed = categoryTasks.filter(task => task.completed).length;
      const total = categoryTasks.length;
      return {
        ...category,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return t.sync.syncing;
      case 'offline':
        return t.sync.offline;
      default:
        return t.sync.synced;
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return '#f59e0b';
      case 'offline':
        return '#ef4444';
      default:
        return '#10b981';
    }
  };

  return (
    <div className={`app ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1 className="app-title">{t.app.title}</h1>
            <div className="header-controls">
              {/* مؤشر حالة المزامنة */}
              <div className="sync-status" onClick={manualSync}>
                <div 
                  className="sync-indicator"
                  style={{ backgroundColor: getSyncStatusColor() }}
                ></div>
                <span className="sync-text">{getSyncStatusText()}</span>
                {!isOnline && <span className="offline-badge">{t.sync.offlineMode}</span>}
              </div>
              
              {/* مبدل اللغة */}
              <button 
                className="language-toggle"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              >
                {language === 'ar' ? 'EN' : 'عر'}
              </button>
            </div>
          </div>
        </header>

        {/* إضافة مهمة جديدة */}
        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={t.tasks.addPlaceholder}
            className="task-input"
            disabled={loading}
          />
          <button type="submit" className="add-button" disabled={loading || !newTask.trim()}>
            {loading ? t.common.loading : t.tasks.add}
          </button>
        </form>

        {/* عرض الأخطاء */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* فلاتر التصنيفات */}
        <div className="categories">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              style={{
                '--category-color': category.color,
                backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                borderColor: category.color,
                color: selectedCategory === category.id ? 'white' : category.color
              }}
            >
              {category.name}
              {category.id !== 'all' && (
                <span className="category-count">
                  {tasks.filter(task => task.category === category.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* إحصائيات */}
        <div className="stats">
          <div className="progress-section">
            <h3>{t.stats.progress}</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' 
                }}
              ></div>
            </div>
            <p className="progress-text">
              {completedTasks} {t.stats.of} {totalTasks} {t.stats.completed}
            </p>
          </div>

          <div className="category-stats">
            <h3>{t.stats.byCategory}</h3>
            <div className="stats-grid">
              {getCategoryStats().map(stat => (
                <div key={stat.id} className="stat-item">
                  <div className="stat-header">
                    <span className="stat-name">{stat.name}</span>
                    <span className="stat-percentage">{stat.percentage}%</span>
                  </div>
                  <div className="stat-progress">
                    <div 
                      className="stat-fill"
                      style={{ 
                        width: `${stat.percentage}%`,
                        backgroundColor: stat.color 
                      }}
                    ></div>
                  </div>
                  <div className="stat-numbers">
                    {stat.completed}/{stat.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* قائمة المهام */}
        <div className="tasks-section">
          <h3>
            {selectedCategory === 'all' ? t.tasks.allTasks : 
             categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>{t.tasks.noTasks}</p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task.id)}
                      className="task-checkbox"
                    />
                    <div className="task-details">
                      <span className="task-title">{task.title}</span>
                      <div className="task-meta">
                        <span 
                          className="task-category"
                          style={{ 
                            color: categories.find(c => c.id === task.category)?.color 
                          }}
                        >
                          {categories.find(c => c.id === task.category)?.name}
                        </span>
                        {task.created_at && (
                          <span className="task-date">
                            {new Date(task.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(task)}
                    className="delete-button"
                    title={t.tasks.delete}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* نافذة تأكيد الحذف */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{t.tasks.confirmDelete}</h3>
              <p>{t.tasks.deleteWarning}</p>
              <div className="modal-actions">
                <button onClick={handleCancelDelete} className="cancel-button">
                  {t.common.cancel}
                </button>
                <button onClick={handleConfirmDelete} className="confirm-button">
                  {t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;

