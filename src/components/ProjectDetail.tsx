import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskForm } from "./TaskForm";

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const project = useQuery(api.projects.get, { id: projectId as any });
  const tasks = useQuery(api.tasks.listByProject, {
    projectId: projectId as any,
    status: statusFilter as any || undefined,
  });

  const deleteTask = useMutation(api.tasks.remove);
  const updateTask = useMutation(api.tasks.update);

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask({ id: taskId as any });
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await updateTask({ id: taskId as any, status: status as any });
  };

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
              project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Priority</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
              project.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.priority}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Progress</p>
            <div className="mt-1">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{project.progress}%</span>
                <span>{project.completedTasks}/{project.taskCount} tasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Manager</p>
            <p className="text-sm text-gray-900 mt-1">{project.managerName}</p>
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks?.map((task) => (
            <div key={task._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {task.assigneeName && (
                      <span>Assigned to: {task.assigneeName}</span>
                    )}
                    {task.estimatedHours && (
                      <span>Est: {task.estimatedHours}h</span>
                    )}
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full border-0 ${
                      task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {tasks?.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No tasks found. Add your first task to get started.
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          projectId={projectId}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {selectedTask && (
        <TaskForm
          projectId={projectId}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
