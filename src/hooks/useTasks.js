import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'

  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // تحميل المهام من التخزين المحلي
  const loadLocalTasks = useCallback(() => {
    try {
      const localTasks = localStorage.getItem('tracklife_tasks');
      if (localTasks) {
        setTasks(JSON.parse(localTasks));
      }
    } catch (error) {
      console.error('Error loading local tasks:', error);
    }
  }, []);

  // حفظ المهام في التخزين المحلي
  const saveLocalTasks = useCallback((tasksToSave) => {
    try {
      localStorage.setItem('tracklife_tasks', JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving local tasks:', error);
    }
  }, []);

  // مزامنة مع الخادم
  const syncWithServer = useCallback(async () => {
    if (!isOnline) return;

    try {
      setSyncStatus('syncing');
      
      // محاولة الحصول على المهام من الخادم
      const serverTasks = await apiService.getTasks();
      
      // دمج المهام المحلية مع مهام الخادم
      const localTasks = JSON.parse(localStorage.getItem('tracklife_tasks') || '[]');
      const mergedTasks = mergeTasks(localTasks, serverTasks);
      
      setTasks(mergedTasks);
      saveLocalTasks(mergedTasks);
      setSyncStatus('synced');
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('offline');
      // في حالة فشل المزامنة، نحمل المهام المحلية
      loadLocalTasks();
    }
  }, [isOnline, loadLocalTasks, saveLocalTasks]);

  // دمج المهام المحلية مع مهام الخادم
  const mergeTasks = (localTasks, serverTasks) => {
    const merged = [...serverTasks];
    
    // إضافة المهام المحلية التي لا توجد في الخادم
    localTasks.forEach(localTask => {
      const existsOnServer = serverTasks.find(serverTask => 
        serverTask.id === localTask.id || 
        (serverTask.title === localTask.title && 
         serverTask.created_at === localTask.created_at)
      );
      
      if (!existsOnServer) {
        merged.push(localTask);
      }
    });
    
    return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // تحميل المهام عند بدء التطبيق
  useEffect(() => {
    loadLocalTasks();
    if (isOnline) {
      syncWithServer();
    }
  }, [loadLocalTasks, syncWithServer, isOnline]);

  // إضافة مهمة جديدة
  const addTask = useCallback(async (taskData) => {
    try {
      setLoading(true);
      setError(null);

      const newTask = {
        id: Date.now(), // معرف مؤقت
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // إضافة المهمة محلياً أولاً
      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      saveLocalTasks(updatedTasks);

      // محاولة إرسالها للخادم إذا كان متصلاً
      if (isOnline) {
        try {
          const serverTask = await apiService.createTask(taskData);
          // تحديث المهمة بالمعرف الحقيقي من الخادم
          const tasksWithServerId = updatedTasks.map(task => 
            task.id === newTask.id ? serverTask : task
          );
          setTasks(tasksWithServerId);
          saveLocalTasks(tasksWithServerId);
        } catch (error) {
          console.error('Failed to sync new task with server:', error);
          setSyncStatus('offline');
        }
      }

      return newTask;
    } catch (error) {
      setError('فشل في إضافة المهمة');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tasks, isOnline, saveLocalTasks]);

  // تحديث مهمة
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      setLoading(true);
      setError(null);

      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      );

      setTasks(updatedTasks);
      saveLocalTasks(updatedTasks);

      // محاولة تحديثها في الخادم إذا كان متصلاً
      if (isOnline) {
        try {
          await apiService.updateTask(taskId, updates);
        } catch (error) {
          console.error('Failed to sync task update with server:', error);
          setSyncStatus('offline');
        }
      }

    } catch (error) {
      setError('فشل في تحديث المهمة');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tasks, isOnline, saveLocalTasks]);

  // حذف مهمة
  const deleteTask = useCallback(async (taskId) => {
    try {
      setLoading(true);
      setError(null);

      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      saveLocalTasks(updatedTasks);

      // محاولة حذفها من الخادم إذا كان متصلاً
      if (isOnline) {
        try {
          await apiService.deleteTask(taskId);
        } catch (error) {
          console.error('Failed to sync task deletion with server:', error);
          setSyncStatus('offline');
        }
      }

    } catch (error) {
      setError('فشل في حذف المهمة');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tasks, isOnline, saveLocalTasks]);

  // مزامنة يدوية
  const manualSync = useCallback(async () => {
    if (isOnline) {
      await syncWithServer();
    }
  }, [isOnline, syncWithServer]);

  return {
    tasks,
    loading,
    error,
    isOnline,
    syncStatus,
    addTask,
    updateTask,
    deleteTask,
    manualSync
  };
};

