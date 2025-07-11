// خدمة API للتواصل مع الواجهة الخلفية
class ApiService {
  constructor() {
    // يمكن تغيير هذا الرابط حسب بيئة النشر
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api'  // في الإنتاج، سيكون API في نفس النطاق
      : 'http://localhost:5000/api'; // في التطوير
    
    this.userId = this.getUserId();
  }

  // الحصول على معرف المستخدم الفريد
  getUserId() {
    let userId = localStorage.getItem('tracklife_user_id');
    if (!userId) {
      // إنشاء معرف فريد للمستخدم
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tracklife_user_id', userId);
    }
    return userId;
  }

  // طلب HTTP عام
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // الحصول على جميع المهام
  async getTasks() {
    return this.request(`/tasks?user_id=${this.userId}`);
  }

  // إنشاء مهمة جديدة
  async createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...task,
        user_id: this.userId
      }),
    });
  }

  // تحديث مهمة
  async updateTask(taskId, updates) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        user_id: this.userId
      }),
    });
  }

  // حذف مهمة
  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}?user_id=${this.userId}`, {
      method: 'DELETE',
    });
  }

  // مزامنة المهام
  async syncTasks(tasks) {
    return this.request('/tasks/sync', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.userId,
        tasks: tasks
      }),
    });
  }

  // التحقق من حالة الاتصال بالخادم
  async checkConnection() {
    try {
      await this.request('/tasks?user_id=' + this.userId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();

