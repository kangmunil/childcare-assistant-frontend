import React from 'react';
import { User } from 'lucide-react';

const MyPage = () => {
    return (
        <div className="text-center p-8 bg-white rounded-xl shadow-md space-y-4">
            <User className="w-10 h-10 text-gray-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">마이페이지</h2>
            <p className="text-gray-500">사용자 정보 및 설정을 관리합니다.</p>
        </div>
    );
};

export default MyPage;