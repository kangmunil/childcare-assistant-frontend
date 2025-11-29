import React from 'react';

const PlaceholderPage = ({ title, icon: Icon, color }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className={`w-24 h-24 ${color} rounded-[2rem] flex items-center justify-center shadow-xl mb-4 rotate-3`}>
            <Icon className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-400 font-medium">더 멋진 기능을 준비하고 있어요! 🚧</p>
        </div>
    </div>
);

export default PlaceholderPage;
