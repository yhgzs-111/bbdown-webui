import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, RefreshCw, Settings, ChevronDown, ChevronUp, Info, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function BBDownWebUI() {
  const [apiUrl, setApiUrl] = useState('http://localhost:23333');
  const [tasks, setTasks] = useState({ Running: [], Finished: [] });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // 成功或一般提示
  
  // 表单状态
  const [formData, setFormData] = useState({
    Url: '',
    UseTvApi: false,
    UseAppApi: false,
    UseIntlApi: false,
    UseMP4box: false,
    EncodingPriority: '',
    DfnPriority: '',
    VideoOnly: false,
    AudioOnly: false,
    DanmakuOnly: false,
    CoverOnly: false,
    SubOnly: false,
    SkipMux: false,
    SkipSubtitle: false,
    SkipCover: false,
    DownloadDanmaku: false,
    DownloadDanmakuFormats: '',
    SkipAi: true,
    VideoAscending: false,
    AudioAscending: false,
    FilePattern: '',
    MultiFilePattern: '',
    SelectPage: '',
    Language: '',
    Cookie: '',
    AccessToken: '',
    WorkDir: '',
    Area: ''
  });

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${apiUrl}/get-tasks/`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setMessage('已成功连接到 BBDown 服务器');
      }
    } catch (err) {
      setError('无法连接到 BBDown 服务器');
    }
  };

  // 自动刷新
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // 添加任务
  const handleAddTask = async () => {
    if (!formData.Url.trim()) return;
    
    setLoading(true);
    
    // 只发送非空值
    const payload = { Url: formData.Url };
    Object.keys(formData).forEach(key => {
      if (key !== 'Url' && formData[key] !== '' && formData[key] !== false) {
        payload[key] = formData[key];
      }
    });

    try {
      const response = await fetch(`${apiUrl}/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setFormData({ ...formData, Url: '' });
        setShowAddTask(false);
        fetchTasks();
        setError('');
      } else {
        setError('添加任务失败');
      }
    } catch (err) {
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  // 移除任务
  const removeTask = async (aid) => {
    try {
      await fetch(`${apiUrl}/remove-finished/${aid}`);
      fetchTasks();
    } catch (err) {
      setError('移除任务失败');
    }
  };

  // 清空已完成任务
  const clearFinished = async () => {
    try {
      await fetch(`${apiUrl}/remove-finished`);
      fetchTasks();
    } catch (err) {
      setError('清空任务失败');
    }
  };

  // 清空失败任务
  const clearFailed = async () => {
    try {
      await fetch(`${apiUrl}/remove-finished/failed`);
      fetchTasks();
    } catch (err) {
      setError('清空失败任务失败');
    }
  };

  // 格式化速度
  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let size = bytesPerSec;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // 格式化大小
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  // 任务卡片组件
  const TaskCard = ({ task, isRunning }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {task.Pic && (
          <img src={task.Pic} alt="" className="w-32 h-20 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate mb-1">
            {task.Title || task.Url || '未知标题'}
          </h3>
          <div className="text-sm text-gray-500 space-y-1">
            <div>AID: {task.Aid}</div>
            {task.VideoPubTime && (
              <div>发布时间: {formatTime(task.VideoPubTime)}</div>
            )}
            <div>创建时间: {formatTime(task.TaskCreateTime)}</div>
            {task.TaskFinishTime && (
              <div>完成时间: {formatTime(task.TaskFinishTime)}</div>
            )}
          </div>
          
          {isRunning ? (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">进度: {(task.Progress * 100).toFixed(1)}%</span>
                <span className="text-blue-600">{formatSpeed(task.DownloadSpeed)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.Progress * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                已下载: {formatSize(task.TotalDownloadedBytes)}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.IsSuccessful ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={task.IsSuccessful ? 'text-green-600' : 'text-red-600'}>
                  {task.IsSuccessful ? '下载成功' : '下载失败'}
                </span>
                <span className="text-gray-500 text-sm">
                  ({formatSize(task.TotalDownloadedBytes)})
                </span>
              </div>
              <button
                onClick={() => removeTask(task.Aid)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">BBDown Web UI</h1>
            </div>
            <button
              onClick={fetchTasks}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* API 地址配置 */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">API 地址:</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://localhost:58682"
            />
          </div>

{message && (
  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
    {message}
  </div>
)}
{error && (
  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
    {error}
  </div>
)}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加下载任务
          </button>
          <button
            onClick={clearFailed}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            清空失败任务
          </button>
          <button
            onClick={clearFinished}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            清空已完成
          </button>
        </div>

        {/* 添加任务表单 */}
        {showAddTask && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">添加下载任务</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视频链接 / BV号 / AV号 *
                </label>
                <input
                  type="text"
                  value={formData.Url}
                  onChange={(e) => setFormData({ ...formData, Url: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.bilibili.com/video/BV... 或 BV1qt4y1X7TW"
                />
              </div>

              {/* 快速选项 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.VideoOnly}
                    onChange={(e) => setFormData({ ...formData, VideoOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">仅视频</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.AudioOnly}
                    onChange={(e) => setFormData({ ...formData, AudioOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">仅音频</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.DownloadDanmaku}
                    onChange={(e) => setFormData({ ...formData, DownloadDanmaku: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">下载弹幕</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.SkipSubtitle}
                    onChange={(e) => setFormData({ ...formData, SkipSubtitle: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">跳过字幕</span>
                </label>
              </div>

              {/* 高级选项 */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Settings className="w-4 h-4" />
                  高级选项
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        编码优先级
                      </label>
                      <input
                        type="text"
                        value={formData.EncodingPriority}
                        onChange={(e) => setFormData({ ...formData, EncodingPriority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="hevc,av1,avc"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        清晰度优先级
                      </label>
                      <input
                        type="text"
                        value={formData.DfnPriority}
                        onChange={(e) => setFormData({ ...formData, DfnPriority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="4K,1080P,720P"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        文件名模板
                      </label>
                      <input
                        type="text"
                        value={formData.FilePattern}
                        onChange={(e) => setFormData({ ...formData, FilePattern: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="<videoTitle>[<dfn>]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        选择分P
                      </label>
                      <input
                        type="text"
                        value={formData.SelectPage}
                        onChange={(e) => setFormData({ ...formData, SelectPage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="1,2,3-5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cookie
                      </label>
                      <input
                        type="text"
                        value={formData.Cookie}
                        onChange={(e) => setFormData({ ...formData, Cookie: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Cookie字符串"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        工作目录
                      </label>
                      <input
                        type="text"
                        value={formData.WorkDir}
                        onChange={(e) => setFormData({ ...formData, WorkDir: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="下载保存目录"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        弹幕格式
                      </label>
                      <input
                        type="text"
                        value={formData.DownloadDanmakuFormats}
                        onChange={(e) => setFormData({ ...formData, DownloadDanmakuFormats: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="xml,json,protobuf,ass"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        地区限制
                      </label>
                      <input
                        type="text"
                        value={formData.Area}
                        onChange={(e) => setFormData({ ...formData, Area: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="hk, tw, th"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.UseTvApi}
                        onChange={(e) => setFormData({ ...formData, UseTvApi: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">使用 TV API</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.UseAppApi}
                        onChange={(e) => setFormData({ ...formData, UseAppApi: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">使用 App API</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.UseIntlApi}
                        onChange={(e) => setFormData({ ...formData, UseIntlApi: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">使用国际版 API</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.SkipMux}
                        onChange={(e) => setFormData({ ...formData, SkipMux: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">跳过混流</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.SkipCover}
                        onChange={(e) => setFormData({ ...formData, SkipCover: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">跳过封面</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.SkipAi}
                        onChange={(e) => setFormData({ ...formData, SkipAi: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">跳过 AI 字幕</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.UseMP4box}
                        onChange={(e) => setFormData({ ...formData, UseMP4box: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">使用 MP4Box</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.VideoAscending}
                        onChange={(e) => setFormData({ ...formData, VideoAscending: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">视频升序</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.AudioAscending}
                        onChange={(e) => setFormData({ ...formData, AudioAscending: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">音频升序</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAddTask}
                  disabled={loading || !formData.Url}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  添加任务
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 正在运行的任务 */}
        {tasks.Running.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              正在下载 ({tasks.Running.length})
            </h2>
            <div className="space-y-3">
              {tasks.Running.map((task) => (
                <TaskCard key={task.Aid} task={task} isRunning={true} />
              ))}
            </div>
          </div>
        )}

        {/* 已完成的任务 */}
        {tasks.Finished.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              已完成 ({tasks.Finished.length})
            </h2>
            <div className="space-y-3">
              {tasks.Finished.map((task, index) => (
                <TaskCard key={`${task.Aid}-${index}`} task={task} isRunning={false} />
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {tasks.Running.length === 0 && tasks.Finished.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无下载任务</p>
            <p className="text-gray-400 text-sm mt-2">点击"添加下载任务"开始下载</p>
          </div>
        )}
      </div>
    </div>
  );
}