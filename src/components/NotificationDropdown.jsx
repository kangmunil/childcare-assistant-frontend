import React from 'react';
import { Bell, Check, Trash2, Calendar, Info, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, markAsRead, clearNotifications } = useStore();

  const getIcon = (type) => {
    switch (type) {
        case 'schedule': return <Calendar className="w-4 h-4 text-blue-500" />;
        case 'alert': return <AlertCircle className="w-4 h-4 text-rose-500" />;
        default: return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">알림 센터</h3>
        {notifications.length > 0 && (
            <button 
                onClick={clearNotifications}
                className="text-[10px] text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
                <Trash2 className="w-3 h-3" /> 지우기
            </button>
        )}
      </div>

      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
            notifications.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 border-b border-gray-50 flex gap-3 cursor-pointer transition-colors ${
                        item.isRead ? 'bg-white opacity-60' : 'bg-blue-50/30 hover:bg-blue-50'
                    }`}
                >
                    <div className="mt-0.5 shrink-0 bg-white p-2 rounded-full shadow-sm h-fit">
                        {getIcon(item.type)}
                    </div>
                    <div className="flex-1">
                        <p className={`text-xs font-bold mb-0.5 ${item.isRead ? 'text-gray-500' : 'text-gray-800'}`}>
                            {item.message}
                        </p>
                        <p className="text-[10px] text-gray-400">{item.time}</p>
                    </div>
                    {!item.isRead && (
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                    )}
                </div>
            ))
        ) : (
            <div className="py-8 text-center text-gray-400 flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">새로운 알림이 없어요</p>
            </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
        <button onClick={onClose} className="text-xs text-gray-500 font-bold w-full py-1 hover:text-gray-800">
            닫기
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;