import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, Info, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead, clearNotifications } = useStore();

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0, transition: { type: "tween", ease: "easeOut", duration: 0.2 } }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'schedule': return <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
            case 'alert': return <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
            default: return <Info className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
        }
    };

    return (
        <div className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">알림 센터</h3>
                {notifications.length > 0 && (
                    <button
                        onClick={clearNotifications}
                        className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> 지우기
                    </button>
                )}
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="show">
                        {notifications.map((item) => (
                            <motion.div
                                variants={itemVariants}
                                key={item.id}
                                onClick={() => markAsRead(item.id)}
                                className={`p-4 border-b border-gray-50 dark:border-gray-700/50 flex gap-3 cursor-pointer transition-colors ${item.isRead ? 'bg-white dark:bg-transparent opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                            >
                                <div className="mt-0.5 shrink-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm dark:shadow-none h-fit border border-gray-100 dark:border-gray-600">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-bold mb-0.5 ${item.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {item.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.time}</p>
                                </div>
                                {!item.isRead && (
                                    <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">새로운 알림이 없어요</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 text-center border-t border-gray-100 dark:border-gray-700">
                <button onClick={onClose} className="text-xs text-gray-500 dark:text-gray-400 font-bold w-full py-1 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    닫기
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;