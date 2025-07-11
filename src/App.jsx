import { useState, useEffect } from 'react'
import './App.css'

// تعريف التصنيفات
const CATEGORIES = {
  work: { name: 'عمل', icon: '💼', color: 'bg-blue-500' },
  personal: { name: 'شخصي', icon: '👤', color: 'bg-green-500' },
  study: { name: 'دراسة', icon: '📚', color: 'bg-purple-500' },
  health: { name: 'صحة', icon: '🏃', color: 'bg-red-500' },
  home: { name: 'منزل', icon: '🏠', color: 'bg-yellow-500' }
}

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('personal')
  const [reminderTime, setReminderTime] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // تحميل المهام من التخزين المحلي عند بدء التطبيق
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks')
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // حفظ المهام في التخزين المحلي عند تغييرها
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  // نظام الإشعارات للتذكيرات
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
      
      tasks.forEach(task => {
        if (task.reminderTime && task.reminderTime === currentTime && !task.completed && !task.reminderShown) {
          // إرسال إشعار
          if (Notification.permission === 'granted') {
            new Notification('تذكير مهمة', {
              body: `حان وقت: ${task.text}`,
              icon: '/favicon.ico'
            })
          }
          
          // تحديث المهمة لتجنب الإشعارات المكررة
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === task.id ? { ...t, reminderShown: true } : t
            )
          )
        }
      })
    }

    // طلب إذن الإشعارات
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // فحص التذكيرات كل دقيقة
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [tasks])

  // إضافة مهمة جديدة
  const addTask = () => {
    if (newTask.trim() !== '') {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        category: selectedCategory,
        reminderTime: reminderTime || null,
        reminderShown: false,
        createdAt: new Date().toISOString()
      }
      setTasks([...tasks, task])
      setNewTask('')
      setReminderTime('')
    }
  }

  // تبديل حالة المهمة (مكتملة/غير مكتملة)
  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  // حذف مهمة
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
    setShowDeleteConfirm(null)
  }

  // تصفية المهام حسب التصنيف
  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === filterCategory)

  // حساب الإحصائيات
  const getStats = () => {
    const stats = {}
    Object.keys(CATEGORIES).forEach(category => {
      const categoryTasks = tasks.filter(task => task.category === category)
      const completedTasks = categoryTasks.filter(task => task.completed)
      stats[category] = {
        total: categoryTasks.length,
        completed: completedTasks.length,
        percentage: categoryTasks.length > 0 ? Math.round((completedTasks.length / categoryTasks.length) * 100) : 0
      }
    })
    return stats
  }

  const stats = getStats()
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">TrackLife</h1>
          <p className="text-gray-600">تطبيق تتبع المهام والعادات اليومية</p>
        </div>

        {/* شريط التقدم العام */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">التقدم العام</h2>
            <span className="text-lg font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {completedTasks} من {totalTasks} مهمة مكتملة
          </p>
        </div>

        {/* إحصائيات التصنيفات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{category.icon}</span>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                </div>
                <span className="text-sm font-bold text-gray-600">
                  {stats[key].percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`${category.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${stats[key].percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {stats[key].completed} من {stats[key].total} مهمة
              </p>
            </div>
          ))}
        </div>

        {/* نموذج إضافة مهمة جديدة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">إضافة مهمة جديدة</h2>
          
          <div className="space-y-4">
            {/* حقل النص */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المهمة
              </label>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="أدخل المهمة الجديدة..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
            </div>

            {/* اختيار التصنيف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* تحديد وقت التذكير */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت التذكير (اختياري)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* زر الإضافة */}
            <button
              onClick={addTask}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
            >
              إضافة المهمة
            </button>
          </div>
        </div>

        {/* أزرار التصفية */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">تصفية المهام</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filterCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              الكل ({tasks.length})
            </button>
            {Object.entries(CATEGORIES).map(([key, category]) => {
              const categoryTasks = tasks.filter(task => task.category === key)
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    filterCategory === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.icon} {category.name} ({categoryTasks.length})
                </button>
              )
            })}
          </div>
        </div>

        {/* قائمة المهام */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {filterCategory === 'all' ? 'جميع المهام' : `مهام ${CATEGORIES[filterCategory]?.name}`}
          </h2>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">لا توجد مهام حالياً</p>
              <p className="text-gray-400 text-sm mt-2">ابدأ بإضافة مهمة جديدة!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                    />
                    <div className="flex-1">
                      <span
                        className={`text-lg ${
                          task.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-800'
                        }`}
                      >
                        {task.text}
                      </span>
                      <div className="flex items-center mt-1 space-x-2 space-x-reverse">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${CATEGORIES[task.category].color} text-white`}>
                          {CATEGORIES[task.category].icon} {CATEGORIES[task.category].name}
                        </span>
                        {task.reminderTime && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏰ {task.reminderTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(task.id)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">تأكيد الحذف</h3>
              <p className="text-gray-600 mb-6">هل أنت متأكد من أنك تريد حذف هذه المهمة؟</p>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => deleteTask(showDeleteConfirm)}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  حذف
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

